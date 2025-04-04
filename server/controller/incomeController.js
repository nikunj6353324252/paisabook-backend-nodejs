const Income = require("../model/incomeModel");

const getIncome = async (req, res) => {
  try {
    const { id, user_id } = req.query;

    if (id) {
      const income = await Income.findById(id);
      if (!income) {
        return res.status(404).json({
          status: false,
          message: "Income not found",
        });
      }

      return res.status(200).json({
        status: true,
        message: "Income fetched successfully",
        income,
      });
    } else {
      const filter = user_id ? { user_id } : {};
      const incomes = await Income.find(filter).sort({ date: -1 });

      return res.status(200).json({
        status: true,
        message: "All incomes fetched successfully",
        incomes,
      });
    }
  } catch (error) {
    console.error("Get income error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const createIncome = async (req, res) => {
  try {
    const {
      amount,
      description,
      date,
      income_category,
      attach_reciept,
      user_id,
    } = req.body;

    if (!amount || !date || !income_category || !user_id) {
      return res.status(400).json({
        status: false,
        message:
          "Fields 'amount', 'date', 'income_category', and 'user_id' are required",
      });
    }

    const newIncome = await Income.create({
      amount,
      description,
      date,
      income_category,
      attach_reciept,
      user_id,
    });

    return res.status(201).json({
      status: true,
      message: "Income added successfully",
      income: newIncome,
    });
  } catch (error) {
    console.error("Create income error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const deleteIncome = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Income ID is required",
      });
    }

    const deletedIncome = await Income.findByIdAndDelete(id);

    if (!deletedIncome) {
      return res.status(404).json({
        status: false,
        message: "Income not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Income deleted successfully",
      deletedIncome,
    });
  } catch (error) {
    console.error("Delete income error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  getIncome,
  createIncome,
  deleteIncome,
};
