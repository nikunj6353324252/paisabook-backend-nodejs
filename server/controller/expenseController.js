const expenseModel = require("../model/expenseModel");
const Budget = require("../model/budgetModel");

const getExpenses = async (req, res) => {
  try {
    const { id } = req.query;

    if (id) {
      const expense = await expenseModel.findById(id);
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
    } else {
      const expenses = await expenseModel.find().sort({ date: -1 });
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

    const query = {};
    if (user_id) query.user_id = user_id;
    if (budget_category) query.budget_category = budget_category;

    const budgets = await Budget.find(query).sort({ createdAt: -1 });

    if (budgets.length > 0) {
      const budget = budgets[0];
      const updatedSpend = budget.spend + parseFloat(amount);
      const usage = updatedSpend / budget.budget_limit;

      if (updatedSpend > budget.budget_limit) {
        return res.status(400).json({
          status: false,
          message: "Expense exceeds budget limit",
          data: {
            usage: usage,
          },
        });
      }

      await Budget.findByIdAndUpdate(budget._id, {
        spend: updatedSpend,
      });
    }

    const newExpense = await expenseModel.create({
      amount,
      description,
      date,
      budget_category,
      attachment_bill,
      user_id,
    });

    return res.status(201).json({
      status: true,
      message: "Expense added successfully",
      expense: newExpense,
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
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Expense ID is required",
      });
    }

    const deletedExpense = await expenseModel.findByIdAndDelete(id);

    if (!deletedExpense) {
      return res.status(404).json({
        status: false,
        message: "Expense not found",
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

module.exports = {
  getExpenses,
  addExpense,
  deleteExpense,
};
