import Income from "../model/incomeModel.js";

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

const updateIncome = async (req, res) => {
  try {
    const { id } = req.query;
    const {
      amount,
      description,
      date,
      income_category,
      attach_reciept,
      user_id,
    } = req.body;

    if (!id || !user_id || !amount || !date || !income_category) {
      return res.status(400).json({
        status: false,
        message:
          "Fields 'id', 'user_id', 'amount', 'date', and 'income_category' are required",
      });
    }

    const updatedIncome = await Income.findOneAndUpdate(
      { _id: id, user_id },
      {
        amount,
        description,
        date,
        income_category,
        attach_reciept,
      },
      { new: true }
    );

    if (!updatedIncome) {
      return res.status(404).json({
        status: false,
        message: "Income not found or unauthorized",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Income updated successfully",
      income: updatedIncome,
    });
  } catch (error) {
    console.error("Update income error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const deleteIncome = async (req, res) => {
  try {
    const { id, user_id } = req.query;

    if (!id || !user_id) {
      return res.status(400).json({
        status: false,
        message: "Income ID and User ID are required",
      });
    }

    const deletedIncome = await Income.findOneAndDelete({ _id: id, user_id });

    if (!deletedIncome) {
      return res.status(404).json({
        status: false,
        message: "Income not found or unauthorized",
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

export { getIncome, createIncome, updateIncome, deleteIncome };
