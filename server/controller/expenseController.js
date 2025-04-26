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
      attachment_bill = "",
      user_id,
      max_threshold,
    } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        status: false,
        message: "Amount is required and must be a valid number",
      });
    }

    if (!date) {
      return res.status(400).json({
        status: false,
        message: "Date is required",
      });
    }

    if (!user_id) {
      return res.status(400).json({
        status: false,
        message: "User ID is required",
      });
    }

    let usage = 0; // ✅ Initialize here always

    // 🔁 Only do budget logic if category is provided
    if (budget_category) {
      const query = { user_id, budget_category };
      const budgets = await Budget.find(query).sort({ createdAt: -1 });
      const budget = budgets[0];

      if (budget) {
        const updatedSpend = budget.spend + parseFloat(amount);
        usage = updatedSpend / budget.budget_limit;

        if (updatedSpend > budget.budget_limit) {
          return res.status(400).json({
            status: false,
            message: "Expense exceeds budget limit",
            data: {
              usage,
              remain: budget.budget_limit - budget.spend,
            },
          });
        }

        await Budget.findByIdAndUpdate(budget._id, {
          spend: updatedSpend,
        });
      }
    }

    const newExpense = await Expense.create({
      amount,
      description,
      date,
      budget_category,
      attachment_bill,
      user_id,
      max_threshold,
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

const deleteExpense = async (req, res) => {
  try {
    const { id, user_id, budget_category, amount } = req.query;

    if (!id || !user_id) {
      return res.status(400).json({
        status: false,
        message: "Expense ID and User ID and budget_category are required",
      });
    }

    const query = { user_id };
    if (budget_category) query.budget_category = budget_category;

    const budgets = await Budget.find(query).sort({ createdAt: -1 });
    const budget = budgets[0];

    if (budget) {
      await Budget.findByIdAndUpdate(budget._id, {
        spend: budget?.spend - amount,
      });
    }

    const deletedExpense = await Expense.findOneAndDelete({
      _id: id,
      user_id,
    });

    if (!deletedExpense) {
      return res.status(404).json({
        status: false,
        message: "Expense not found or unauthorized",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Expense deleted successfully",
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

export { getExpenses, addExpense, deleteExpense };
