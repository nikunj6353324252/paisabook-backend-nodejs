const Budget = require("../model/budgetModel");

const getBudgets = async (req, res) => {
  try {
    const { id, user_id, budget_category } = req.query;

    // Case 1: Get by ID
    if (id) {
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
    }

    // Case 2: Get by user_id and optional budget_category
    const query = {};
    if (user_id) query.user_id = user_id;
    if (budget_category) query.budget_category = budget_category;

    const budgets = await Budget.find(query).sort({ createdAt: -1 });

    if (budget_category && budgets.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No budget found for the given category",
      });
    }

    return res.status(200).json({
      status: true,
      message: budget_category
        ? "Budget by category fetched successfully"
        : "All budgets fetched successfully",
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
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
};
