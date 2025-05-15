import cloudinary from "../Config/CloudinaryConfig.js";
import Budget from "../model/budgetModel.js";
import Expense from "../model/expenseModel.js";

const getExpenses = async (req, res) => {
  try {
    const { id, user_id } = req.query;

    if (id) {
      const expense = await Expense.findById(id);
      if (!expense) {
        return res.status(404).json({
          status: false,
          message: "Expense not found",
        });
      }

      return res.status(200).json({
        status: true,
        message: "Expense fetched successfully",
        expense,
      });
    } else if (user_id) {
      const expenses = await Expense.find({ user_id }).sort({ date: -1 });

      return res.status(200).json({
        status: true,
        message: "User expenses fetched successfully",
        expenses,
      });
    } else {
      const expenses = await Expense.find().sort({ date: -1 });

      return res.status(200).json({
        status: true,
        message: "All expenses fetched successfully",
        expenses,
      });
    }
  } catch (error) {
    console.error("Get expenses error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const addExpense = async (req, res) => {
  try {
    const {
      amount,
      description = "",
      date,
      budget_category = "",
      user_id,
      max_threshold,
    } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        status: false,
        message: "Amount is required and must be a valid number",
      });
    }

    if (!date || !user_id) {
      return res.status(400).json({
        status: false,
        message: "Date and User ID are required",
      });
    }

    let usage = 0;
    if (budget_category) {
      const budgets = await Budget.find({ user_id, budget_category }).sort({
        createdAt: -1,
      });
      const budget = budgets[0];
      if (budget) {
        const updatedSpend = budget.spend + parseFloat(amount);
        usage = updatedSpend / budget.budget_limit;
        if (updatedSpend > budget.budget_limit) {
          return res.status(400).json({
            status: false,
            message: "Expense exceeds budget limit",
            data: { usage, remain: budget.budget_limit - budget.spend },
          });
        }
        await Budget.findByIdAndUpdate(budget._id, { spend: updatedSpend });
      }
    }

    let uploadedImage = null;
    if (req.file) {
      const base64Image = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
      uploadedImage = await cloudinary.uploader.upload(base64Image, {
        folder: "expense_bills",
      });
    }

    const newExpense = await Expense.create({
      amount,
      description,
      date,
      budget_category,
      user_id,
      max_threshold,
      attachment_bill: uploadedImage?.secure_url || "",
      attachment_public_id: uploadedImage?.public_id || "",
    });

    return res.status(201).json({
      status: true,
      message: "Expense added successfully",
      expense: newExpense,
      usage,
      max_threshold_alert_visible: usage >= max_threshold,
    });
  } catch (error) {
    console.error("Add Expense error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const updateExpense = async (req, res) => {
  try {
    const { id } = req.query;
    const {
      user_id,
      amount,
      description = "",
      date,
      budget_category = "",
      max_threshold,
    } = req.body;

    if (!id || !user_id || !amount || !date) {
      return res.status(400).json({
        status: false,
        message: "Fields 'id', 'user_id', 'amount', and 'date' are required",
      });
    }

    const existingExpense = await Expense.findOne({ _id: id, user_id });
    if (!existingExpense) {
      return res.status(404).json({
        status: false,
        message: "Expense not found or unauthorized",
      });
    }

    if (existingExpense.budget_category !== budget_category) {
      if (existingExpense.budget_category) {
        const oldBudget = await Budget.findOne({
          user_id,
          budget_category: existingExpense.budget_category,
        });
        if (oldBudget) {
          oldBudget.spend -= parseFloat(existingExpense.amount);
          oldBudget.spend = Math.max(0, oldBudget.spend);
          await oldBudget.save();
        }
      }

      if (budget_category) {
        const newBudget = await Budget.findOne({ user_id, budget_category });
        if (newBudget) {
          newBudget.spend += parseFloat(amount);
          await newBudget.save();
        }
      }
    } else if (budget_category) {
      const budget = await Budget.findOne({ user_id, budget_category });
      if (budget) {
        const delta = parseFloat(amount) - parseFloat(existingExpense.amount);
        const updatedSpend = budget.spend + delta;
        if (updatedSpend > budget.budget_limit) {
          return res.status(400).json({
            status: false,
            message: "Updated expense exceeds budget limit",
            data: {
              usage: updatedSpend / budget.budget_limit,
              remain: budget.budget_limit - updatedSpend,
            },
          });
        }
        budget.spend = updatedSpend;
        await budget.save();
      }
    }

    let updatedData = {
      amount,
      description,
      date,
      budget_category,
      max_threshold,
    };

    if (req.file) {
      if (existingExpense.attachment_public_id) {
        await cloudinary.uploader.destroy(existingExpense.attachment_public_id);
      }

      const base64Image = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
      const uploadedImage = await cloudinary.uploader.upload(base64Image, {
        folder: "expense_bills",
      });

      updatedData.attachment_bill = uploadedImage.secure_url;
      updatedData.attachment_public_id = uploadedImage.public_id;
    }

    const updatedExpense = await Expense.findOneAndUpdate(
      { _id: id, user_id },
      updatedData,
      { new: true }
    );

    return res.status(200).json({
      status: true,
      message: "Expense updated successfully",
      expense: updatedExpense,
    });
  } catch (error) {
    console.error("Update expense error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { id, user_id, budget_category, amount } = req.query;

    if (!id || !user_id) {
      return res.status(400).json({
        status: false,
        message: "Expense ID and User ID are required",
      });
    }

    const expense = await Expense.findOne({ _id: id, user_id });

    if (!expense) {
      return res.status(404).json({
        status: false,
        message: "Expense not found or unauthorized",
      });
    }

    if (expense.attachment_public_id) {
      await cloudinary.uploader.destroy(expense.attachment_public_id);
    }

    if (budget_category) {
      const budgets = await Budget.find({ user_id, budget_category }).sort({
        createdAt: -1,
      });
      const budget = budgets[0];
      if (budget) {
        await Budget.findByIdAndUpdate(budget._id, {
          spend: Math.max(0, budget.spend - parseFloat(expense.amount)),
        });
      }
    }

    const deletedExpense = await Expense.findOneAndDelete({
      _id: id,
      user_id,
    });

    return res.status(200).json({
      status: true,
      message: "Expense and image deleted successfully",
      deletedExpense,
    });
  } catch (error) {
    console.error("Delete expense error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export { getExpenses, addExpense, updateExpense, deleteExpense };
