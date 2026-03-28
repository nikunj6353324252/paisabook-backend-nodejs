import mongoose from "mongoose";
import Investment from "../model/investmentModel.js";
import InvestmentHistory from "../model/investmentHistoryModel.js";

const HISTORY_FORMATS = {
  daily: "%Y-%m-%d",
  monthly: "%Y-%m",
  yearly: "%Y",
};

const toNumber = (value) => Number.parseFloat(value);

const calculateProfitLoss = (investedAmount, currentValue) => {
  const profitLoss = Number((currentValue - investedAmount).toFixed(2));
  const profitLossPercentage =
    investedAmount > 0
      ? Number(((profitLoss / investedAmount) * 100).toFixed(2))
      : 0;

  return { profitLoss, profitLossPercentage };
};

const createSnapshot = async ({
  investmentId,
  userId,
  investedAmount,
  currentValue,
  snapshotDate,
  notes = "",
}) => {
  const { profitLoss, profitLossPercentage } = calculateProfitLoss(
    investedAmount,
    currentValue
  );

  return InvestmentHistory.create({
    investment_id: investmentId,
    user_id: userId,
    invested_amount: investedAmount,
    current_value: currentValue,
    profit_loss: profitLoss,
    profit_loss_percentage: profitLossPercentage,
    snapshot_date: snapshotDate,
    notes,
  });
};

const getInvestments = async (req, res) => {
  try {
    const { id, user_id } = req.query;

    if (id) {
      const investment = await Investment.findById(id);
      if (!investment) {
        return res.status(404).json({
          status: false,
          message: "Investment not found",
        });
      }

      return res.status(200).json({
        status: true,
        message: "Investment fetched successfully",
        investment,
      });
    }

    const filter = user_id ? { user_id } : {};
    const investments = await Investment.find(filter).sort({ createdAt: -1 });
    const summary = investments.reduce(
      (accumulator, investment) => {
        accumulator.total_invested_amount += investment.invested_amount;
        accumulator.total_current_value += investment.current_value;
        return accumulator;
      },
      {
        total_invested_amount: 0,
        total_current_value: 0,
      }
    );

    summary.total_profit_loss = Number(
      (summary.total_current_value - summary.total_invested_amount).toFixed(2)
    );
    summary.total_profit_loss_percentage =
      summary.total_invested_amount > 0
        ? Number(
            (
              (summary.total_profit_loss / summary.total_invested_amount) *
              100
            ).toFixed(2)
          )
        : 0;

    return res.status(200).json({
      status: true,
      message: "Investments fetched successfully",
      investments,
      summary,
    });
  } catch (error) {
    console.error("Get investment error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const createInvestment = async (req, res) => {
  try {
    const {
      user_id,
      investment_name,
      investment_type,
      platform = "",
      invested_amount,
      current_value,
      quantity = 0,
      average_buy_price = 0,
      current_price = 0,
      investment_date,
      notes = "",
      snapshot_date,
      create_initial_history = true,
    } = req.body;

    if (
      !user_id ||
      !investment_name ||
      !investment_type ||
      invested_amount === undefined ||
      current_value === undefined ||
      !investment_date
    ) {
      return res.status(400).json({
        status: false,
        message:
          "Fields 'user_id', 'investment_name', 'investment_type', 'invested_amount', 'current_value', and 'investment_date' are required",
      });
    }

    const parsedInvestedAmount = toNumber(invested_amount);
    const parsedCurrentValue = toNumber(current_value);
    const parsedQuantity = toNumber(quantity) || 0;
    const parsedAverageBuyPrice = toNumber(average_buy_price) || 0;
    const parsedCurrentPrice = toNumber(current_price) || 0;

    if (
      [parsedInvestedAmount, parsedCurrentValue, parsedQuantity].some((value) =>
        Number.isNaN(value)
      )
    ) {
      return res.status(400).json({
        status: false,
        message: "Investment numeric fields must be valid numbers",
      });
    }

    const newInvestment = await Investment.create({
      user_id,
      investment_name,
      investment_type,
      platform,
      invested_amount: parsedInvestedAmount,
      current_value: parsedCurrentValue,
      quantity: parsedQuantity,
      average_buy_price: parsedAverageBuyPrice,
      current_price: parsedCurrentPrice,
      investment_date,
      notes,
    });

    let history = null;
    if (create_initial_history !== false) {
      history = await createSnapshot({
        investmentId: newInvestment._id,
        userId: user_id,
        investedAmount: parsedInvestedAmount,
        currentValue: parsedCurrentValue,
        snapshotDate: snapshot_date || investment_date,
        notes,
      });
    }

    return res.status(201).json({
      status: true,
      message: "Investment created successfully",
      investment: newInvestment,
      history,
    });
  } catch (error) {
    console.error("Create investment error:", error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

const updateInvestment = async (req, res) => {
  try {
    const { id } = req.query;
    const {
      user_id,
      investment_name,
      investment_type,
      platform = "",
      invested_amount,
      current_value,
      quantity = 0,
      average_buy_price = 0,
      current_price = 0,
      investment_date,
      notes = "",
      snapshot_date,
      create_history = true,
    } = req.body;

    if (
      !id ||
      !user_id ||
      !investment_name ||
      !investment_type ||
      invested_amount === undefined ||
      current_value === undefined ||
      !investment_date
    ) {
      return res.status(400).json({
        status: false,
        message:
          "Fields 'id', 'user_id', 'investment_name', 'investment_type', 'invested_amount', 'current_value', and 'investment_date' are required",
      });
    }

    const existingInvestment = await Investment.findOne({ _id: id, user_id });
    if (!existingInvestment) {
      return res.status(404).json({
        status: false,
        message: "Investment not found or unauthorized",
      });
    }

    const parsedInvestedAmount = toNumber(invested_amount);
    const parsedCurrentValue = toNumber(current_value);
    const parsedQuantity = toNumber(quantity) || 0;
    const parsedAverageBuyPrice = toNumber(average_buy_price) || 0;
    const parsedCurrentPrice = toNumber(current_price) || 0;

    if (
      [
        parsedInvestedAmount,
        parsedCurrentValue,
        parsedQuantity,
        parsedAverageBuyPrice,
        parsedCurrentPrice,
      ].some((value) => Number.isNaN(value))
    ) {
      return res.status(400).json({
        status: false,
        message: "Investment numeric fields must be valid numbers",
      });
    }

    const updatedInvestment = await Investment.findOneAndUpdate(
      { _id: id, user_id },
      {
        investment_name,
        investment_type,
        platform,
        invested_amount: parsedInvestedAmount,
        current_value: parsedCurrentValue,
        quantity: parsedQuantity,
        average_buy_price: parsedAverageBuyPrice,
        current_price: parsedCurrentPrice,
        investment_date,
        notes,
      },
      { new: true }
    );

    let history = null;
    if (create_history !== false) {
      history = await createSnapshot({
        investmentId: updatedInvestment._id,
        userId: user_id,
        investedAmount: parsedInvestedAmount,
        currentValue: parsedCurrentValue,
        snapshotDate: snapshot_date || new Date(),
        notes,
      });
    }

    return res.status(200).json({
      status: true,
      message: "Investment updated successfully",
      investment: updatedInvestment,
      history,
    });
  } catch (error) {
    console.error("Update investment error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const deleteInvestment = async (req, res) => {
  try {
    const { id, user_id } = req.query;

    if (!id || !user_id) {
      return res.status(400).json({
        status: false,
        message: "Fields 'id' and 'user_id' are required",
      });
    }

    const deletedInvestment = await Investment.findOneAndDelete({
      _id: id,
      user_id,
    });

    if (!deletedInvestment) {
      return res.status(404).json({
        status: false,
        message: "Investment not found or unauthorized",
      });
    }

    await InvestmentHistory.deleteMany({
      investment_id: deletedInvestment._id,
      user_id,
    });

    return res.status(200).json({
      status: true,
      message: "Investment deleted successfully",
      deletedInvestment,
    });
  } catch (error) {
    console.error("Delete investment error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const createInvestmentHistory = async (req, res) => {
  try {
    const {
      investment_id,
      user_id,
      snapshot_date,
      invested_amount,
      current_value,
      notes = "",
      sync_current_value = true,
      current_price,
    } = req.body;

    if (!investment_id || !user_id || current_value === undefined) {
      return res.status(400).json({
        status: false,
        message:
          "Fields 'investment_id', 'user_id', and 'current_value' are required",
      });
    }

    const investment = await Investment.findOne({ _id: investment_id, user_id });
    if (!investment) {
      return res.status(404).json({
        status: false,
        message: "Investment not found or unauthorized",
      });
    }

    const parsedInvestedAmount =
      invested_amount === undefined
        ? investment.invested_amount
        : toNumber(invested_amount);
    const parsedCurrentValue = toNumber(current_value);
    const parsedCurrentPrice =
      current_price === undefined ? investment.current_price : toNumber(current_price);

    if (
      [parsedInvestedAmount, parsedCurrentValue, parsedCurrentPrice].some((value) =>
        Number.isNaN(value)
      )
    ) {
      return res.status(400).json({
        status: false,
        message: "History numeric fields must be valid numbers",
      });
    }

    const history = await createSnapshot({
      investmentId: investment._id,
      userId: user_id,
      investedAmount: parsedInvestedAmount,
      currentValue: parsedCurrentValue,
      snapshotDate: snapshot_date || new Date(),
      notes,
    });

    if (sync_current_value !== false) {
      investment.current_value = parsedCurrentValue;
      investment.invested_amount = parsedInvestedAmount;
      investment.current_price = parsedCurrentPrice;
      if (notes) {
        investment.notes = notes;
      }
      await investment.save();
    }

    return res.status(201).json({
      status: true,
      message: "Investment history created successfully",
      history,
      investment,
    });
  } catch (error) {
    console.error("Create investment history error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const getInvestmentHistory = async (req, res) => {
  try {
    const {
      user_id,
      investment_id,
      filter = "daily",
      from,
      to,
      timezone = "UTC",
    } = req.query;

    if (!user_id) {
      return res.status(400).json({
        status: false,
        message: "Field 'user_id' is required",
      });
    }

    if (!HISTORY_FORMATS[filter]) {
      return res.status(400).json({
        status: false,
        message: "Filter must be one of 'daily', 'monthly', or 'yearly'",
      });
    }

    const match = {
      user_id: new mongoose.Types.ObjectId(user_id),
    };

    if (investment_id) {
      match.investment_id = new mongoose.Types.ObjectId(investment_id);
    }

    if (from || to) {
      match.snapshot_date = {};
      if (from) {
        match.snapshot_date.$gte = new Date(from);
      }
      if (to) {
        match.snapshot_date.$lte = new Date(to);
      }
    }

    const bucketExpression = {
      $dateToString: {
        format: HISTORY_FORMATS[filter],
        date: "$snapshot_date",
        timezone,
      },
    };

    const history = await InvestmentHistory.aggregate([
      { $match: match },
      { $sort: { snapshot_date: 1, createdAt: 1 } },
      {
        $group: {
          _id: {
            period: bucketExpression,
            investment_id: "$investment_id",
          },
          snapshot_date: { $last: "$snapshot_date" },
          invested_amount: { $last: "$invested_amount" },
          current_value: { $last: "$current_value" },
          profit_loss: { $last: "$profit_loss" },
          profit_loss_percentage: { $last: "$profit_loss_percentage" },
        },
      },
      {
        $group: {
          _id: "$_id.period",
          period_end: { $max: "$snapshot_date" },
          total_invested_amount: { $sum: "$invested_amount" },
          total_current_value: { $sum: "$current_value" },
          total_profit_loss: { $sum: "$profit_loss" },
          average_profit_loss_percentage: { $avg: "$profit_loss_percentage" },
          investments_count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          period: "$_id",
          period_end: 1,
          total_invested_amount: { $round: ["$total_invested_amount", 2] },
          total_current_value: { $round: ["$total_current_value", 2] },
          total_profit_loss: { $round: ["$total_profit_loss", 2] },
          average_profit_loss_percentage: {
            $round: ["$average_profit_loss_percentage", 2],
          },
          investments_count: 1,
        },
      },
      { $sort: { period_end: 1 } },
    ]);

    const latestSummary = await InvestmentHistory.aggregate([
      { $match: match },
      { $sort: { snapshot_date: 1, createdAt: 1 } },
      {
        $group: {
          _id: "$investment_id",
          snapshot_date: { $last: "$snapshot_date" },
          invested_amount: { $last: "$invested_amount" },
          current_value: { $last: "$current_value" },
          profit_loss: { $last: "$profit_loss" },
          profit_loss_percentage: { $last: "$profit_loss_percentage" },
        },
      },
      {
        $group: {
          _id: null,
          latest_snapshot_date: { $max: "$snapshot_date" },
          total_invested_amount: { $sum: "$invested_amount" },
          total_current_value: { $sum: "$current_value" },
          total_profit_loss: { $sum: "$profit_loss" },
          average_profit_loss_percentage: { $avg: "$profit_loss_percentage" },
          investments_count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          latest_snapshot_date: 1,
          total_invested_amount: { $round: ["$total_invested_amount", 2] },
          total_current_value: { $round: ["$total_current_value", 2] },
          total_profit_loss: { $round: ["$total_profit_loss", 2] },
          average_profit_loss_percentage: {
            $round: ["$average_profit_loss_percentage", 2],
          },
          investments_count: 1,
        },
      },
    ]);

    let summary = latestSummary[0];
    if (!summary) {
      const investmentFilter = investment_id ? { _id: investment_id, user_id } : { user_id };
      const investments = await Investment.find(investmentFilter);
      summary = investments.reduce(
        (accumulator, investment) => {
          accumulator.total_invested_amount += investment.invested_amount;
          accumulator.total_current_value += investment.current_value;
          accumulator.investments_count += 1;
          return accumulator;
        },
        {
          latest_snapshot_date: null,
          total_invested_amount: 0,
          total_current_value: 0,
          total_profit_loss: 0,
          average_profit_loss_percentage: 0,
          investments_count: 0,
        }
      );
      summary.total_profit_loss = Number(
        (summary.total_current_value - summary.total_invested_amount).toFixed(2)
      );
      summary.average_profit_loss_percentage =
        summary.total_invested_amount > 0
          ? Number(
              (
                (summary.total_profit_loss / summary.total_invested_amount) *
                100
              ).toFixed(2)
            )
          : 0;
    }

    return res.status(200).json({
      status: true,
      message: "Investment history fetched successfully",
      filter,
      timezone,
      summary,
      history,
    });
  } catch (error) {
    console.error("Get investment history error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export {
  createInvestment,
  createInvestmentHistory,
  deleteInvestment,
  getInvestmentHistory,
  getInvestments,
  updateInvestment,
};
