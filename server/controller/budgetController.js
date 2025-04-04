const Budget = require("../model/budgetModel");

const createBudget = async (req, res) => {
  try {
    const {
      budget_category,
      budget_limit,
      budget_period,
      spend = 0,
      user_id,
    } = req.body;

    if (!budget_category || !budget_limit || !budget_period || !user_id) {
      return res.status(400).json({
        status: false,
        message:
          "Required fields: budget_category, budget_limit, budget_period, user_id",
      });
    }

    const budget = await Budget.create({
      budget_category,
      budget_limit,
      budget_period,
      spend,
      user_id,
    });

    return res.status(201).json({
      status: true,
      message: "Budget created successfully",
      budget,
    });
  } catch (error) {
    console.error("Create budget error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const getAllBudgets = async (req, res) => {
  try {
    const { user_id } = req.query;

    const query = user_id ? { user_id } : {};
    const budgets = await Budget.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      message: "Budgets fetched successfully",
      budgets,
    });
  } catch (error) {
    console.error("Get budgets error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const getBudgetById = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Budget ID is required",
      });
    }

    const budget = await Budget.findById(id);
    if (!budget) {
      return res.status(404).json({
        status: false,
        message: "Budget not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Budget fetched successfully",
      budget,
    });
  } catch (error) {
    console.error("Get budget error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const updateBudget = async (req, res) => {
  try {
    const { id } = req.body;
    const updateFields = req.body;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Budget ID is required",
      });
    }

    const updated = await Budget.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({
        status: false,
        message: "Budget not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Budget updated successfully",
      budget: updated,
    });
  } catch (error) {
    console.error("Update budget error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Budget ID is required",
      });
    }

    const deleted = await Budget.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        status: false,
        message: "Budget not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Budget deleted successfully",
      deletedBudget: deleted,
    });
  } catch (error) {
    console.error("Delete budget error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createBudget,
  getAllBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
};
