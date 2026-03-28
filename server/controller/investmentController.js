import mongoose from "mongoose";
import Investment from "../model/investmentModel.js";
import InvestmentHistory from "../model/investmentHistoryModel.js";

const HISTORY_FORMATS = {
  daily: "%Y-%m-%d",
  monthly: "%Y-%m",
  yearly: "%Y",
};

const TRADE_TYPES = new Set(["stock_delivery", "stock_option", "index_option"]);
const OPTION_TYPES = new Set(["stock_option", "index_option"]);
const CALL_PUT_VALUES = new Set(["call", "put"]);

const toNumber = (value) => Number.parseFloat(value);
const roundValue = (value) => Number(Number(value || 0).toFixed(2));
const normalizeTradeType = (value = "") =>
  String(value).trim().toLowerCase().replace(/\s+/g, "_");
const normalizeCallPut = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return String(value).trim().toLowerCase();
};

const normalizeNullableText = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
};

const normalizeQuantity = (value) => {
  const parsed = toNumber(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 1;
  }

  return parsed;
};

const calculateComputedFields = (trade) => {
  const quantity = trade.quantity || 1;
  const totalBuyAmount = roundValue((trade.buy_price || 0) * quantity);
  const completed =
    trade.status === "completed" &&
    trade.sell_price !== null &&
    trade.sell_price !== undefined &&
    trade.sell_price_date;

  if (!completed) {
    return {
      ...trade,
      profit_loss: null,
      roi: null,
      total_buy_amount: totalBuyAmount,
      total_sell_amount: null,
    };
  }

  const totalSellAmount = roundValue((trade.sell_price || 0) * quantity);
  const profitLoss = roundValue(totalSellAmount - totalBuyAmount);
  const roi =
    totalBuyAmount > 0 ? roundValue((profitLoss / totalBuyAmount) * 100) : 0;

  return {
    ...trade,
    profit_loss: profitLoss,
    roi,
    total_buy_amount: totalBuyAmount,
    total_sell_amount: totalSellAmount,
  };
};

const serializeInvestment = (investment) => {
  const raw =
    typeof investment.toObject === "function"
      ? investment.toObject({ versionKey: false })
      : investment;

  return calculateComputedFields({
    ...raw,
    stock_name: raw.stock_name ?? null,
    index_name: raw.index_name ?? null,
    buy_which_price_option: raw.buy_which_price_option ?? null,
    call_or_put: raw.call_or_put ?? null,
    sell_price: raw.sell_price ?? null,
    sell_price_date: raw.sell_price_date ?? null,
    created_at: raw.createdAt,
    updated_at: raw.updatedAt,
  });
};

const buildBaseTradePayload = (payload) => {
  const investmentType = normalizeTradeType(payload.investment_type);
  const stockName = normalizeNullableText(payload.stock_name);
  const indexName = normalizeNullableText(payload.index_name);
  const callOrPut = normalizeCallPut(payload.call_or_put);
  const quantity = normalizeQuantity(payload.quantity);
  const buyPrice = toNumber(payload.buy_price);
  const buyPriceDate = payload.buy_price_date;
  const strikeInput = payload.buy_which_price_option;
  const buyWhichPriceOption =
    strikeInput === undefined || strikeInput === null || strikeInput === ""
      ? null
      : toNumber(strikeInput);

  if (!payload.user_id) {
    return { error: "Field 'user_id' is required" };
  }

  if (!TRADE_TYPES.has(investmentType)) {
    return {
      error:
        "Field 'investment_type' must be one of 'stock_delivery', 'stock_option', or 'index_option'",
    };
  }

  if (Number.isNaN(buyPrice) || buyPrice <= 0) {
    return { error: "Field 'buy_price' must be a valid number greater than 0" };
  }

  if (!buyPriceDate) {
    return { error: "Field 'buy_price_date' is required" };
  }

  if (investmentType === "stock_delivery") {
    if (!stockName) {
      return { error: "Field 'stock_name' is required for stock_delivery" };
    }
  }

  if (investmentType === "stock_option") {
    if (!stockName) {
      return { error: "Field 'stock_name' is required for stock_option" };
    }
    if (buyWhichPriceOption === null || Number.isNaN(buyWhichPriceOption)) {
      return {
        error: "Field 'buy_which_price_option' is required for stock_option",
      };
    }
    if (!CALL_PUT_VALUES.has(callOrPut)) {
      return { error: "Field 'call_or_put' must be 'call' or 'put'" };
    }
  }

  if (investmentType === "index_option") {
    if (!indexName) {
      return { error: "Field 'index_name' is required for index_option" };
    }
    if (buyWhichPriceOption === null || Number.isNaN(buyWhichPriceOption)) {
      return {
        error: "Field 'buy_which_price_option' is required for index_option",
      };
    }
    if (!CALL_PUT_VALUES.has(callOrPut)) {
      return { error: "Field 'call_or_put' must be 'call' or 'put'" };
    }
  }

  return {
    data: {
      user_id: payload.user_id,
      investment_type: investmentType,
      stock_name:
        investmentType === "stock_delivery" || investmentType === "stock_option"
          ? stockName
          : null,
      index_name: investmentType === "index_option" ? indexName : null,
      buy_which_price_option: OPTION_TYPES.has(investmentType)
        ? roundValue(buyWhichPriceOption)
        : null,
      call_or_put: OPTION_TYPES.has(investmentType) ? callOrPut : null,
      quantity,
      buy_price: roundValue(buyPrice),
      buy_price_date: buyPriceDate,
    },
  };
};

const buildCreatePayload = (payload) => {
  const result = buildBaseTradePayload(payload);
  if (result.error) {
    return result;
  }

  return {
    data: {
      ...result.data,
      sell_price: null,
      sell_price_date: null,
      status: "open",
    },
  };
};

const buildUpdatePayload = (payload, existingInvestment) => {
  const result = buildBaseTradePayload(payload);
  if (result.error) {
    return result;
  }

  const requestedStatus =
    payload.status === undefined || payload.status === null || payload.status === ""
      ? existingInvestment.status
      : String(payload.status).trim().toLowerCase();

  if (!["open", "completed"].includes(requestedStatus)) {
    return { error: "Field 'status' must be 'open' or 'completed'" };
  }

  let sellPrice = null;
  let sellPriceDate = null;

  if (requestedStatus === "completed") {
    const parsedSellPrice = toNumber(payload.sell_price);
    if (Number.isNaN(parsedSellPrice) || parsedSellPrice <= 0) {
      return {
        error:
          "Fields 'sell_price' and 'sell_price_date' are required when status is 'completed'",
      };
    }
    if (!payload.sell_price_date) {
      return {
        error:
          "Fields 'sell_price' and 'sell_price_date' are required when status is 'completed'",
      };
    }

    sellPrice = roundValue(parsedSellPrice);
    sellPriceDate = payload.sell_price_date;
  }

  return {
    data: {
      ...result.data,
      sell_price: sellPrice,
      sell_price_date: sellPriceDate,
      status: requestedStatus,
    },
  };
};

const createCompletedSnapshot = async (investment) => {
  const serialized = serializeInvestment(investment);
  if (serialized.status !== "completed") {
    return null;
  }

  return InvestmentHistory.create({
    investment_id: serialized._id,
    user_id: serialized.user_id,
    invested_amount: serialized.total_buy_amount,
    current_value: serialized.total_sell_amount,
    profit_loss: serialized.profit_loss,
    profit_loss_percentage: serialized.roi,
    snapshot_date: serialized.sell_price_date,
    notes: "",
  });
};

const getInvestments = async (req, res) => {
  try {
    const { id, user_id, investment_type, status } = req.query;

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
        investment: serializeInvestment(investment),
      });
    }

    if (!user_id) {
      return res.status(400).json({
        status: false,
        message: "Field 'user_id' is required",
      });
    }

    const filter = { user_id };
    if (investment_type) {
      filter.investment_type = normalizeTradeType(investment_type);
    }
    if (status) {
      filter.status = String(status).trim().toLowerCase();
    }

    const investments = await Investment.find(filter).sort({
      createdAt: -1,
      updatedAt: -1,
    });

    return res.status(200).json({
      status: true,
      investments: investments.map(serializeInvestment),
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
    const result = buildCreatePayload(req.body);
    if (result.error) {
      return res.status(400).json({
        status: false,
        message: result.error,
      });
    }

    const investment = await Investment.create(result.data);

    return res.status(201).json({
      status: true,
      message: "Trade created successfully",
      investment: serializeInvestment(investment),
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
    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Field 'id' is required",
      });
    }

    if (!req.body.user_id) {
      return res.status(400).json({
        status: false,
        message: "Field 'user_id' is required",
      });
    }

    const existingInvestment = await Investment.findOne({
      _id: id,
      user_id: req.body.user_id,
    });

    if (!existingInvestment) {
      return res.status(404).json({
        status: false,
        message: "Investment not found or unauthorized",
      });
    }

    const result = buildUpdatePayload(req.body, existingInvestment);
    if (result.error) {
      return res.status(400).json({
        status: false,
        message: result.error,
      });
    }

    const updatedInvestment = await Investment.findOneAndUpdate(
      { _id: id, user_id: req.body.user_id },
      result.data,
      { new: true }
    );

    if (updatedInvestment.status === "completed") {
      await createCompletedSnapshot(updatedInvestment);
    }

    return res.status(200).json({
      status: true,
      message: "Trade updated successfully",
      investment: serializeInvestment(updatedInvestment),
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
      message: "Trade deleted successfully",
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
    const { investment_id, user_id, snapshot_date } = req.body;

    if (!investment_id || !user_id) {
      return res.status(400).json({
        status: false,
        message: "Fields 'investment_id' and 'user_id' are required",
      });
    }

    const investment = await Investment.findOne({ _id: investment_id, user_id });
    if (!investment) {
      return res.status(404).json({
        status: false,
        message: "Investment not found or unauthorized",
      });
    }

    const serialized = serializeInvestment(investment);
    if (serialized.status !== "completed") {
      return res.status(400).json({
        status: false,
        message: "History can only be created for completed trades",
      });
    }

    const history = await InvestmentHistory.create({
      investment_id: investment._id,
      user_id,
      invested_amount: serialized.total_buy_amount,
      current_value: serialized.total_sell_amount,
      profit_loss: serialized.profit_loss,
      profit_loss_percentage: serialized.roi,
      snapshot_date: snapshot_date || serialized.sell_price_date,
      notes: "",
    });

    return res.status(201).json({
      status: true,
      message: "Investment history created successfully",
      history,
      investment: serialized,
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
      investment_type,
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
      status: "completed",
      sell_price_date: { $ne: null },
    };

    if (investment_id) {
      match._id = new mongoose.Types.ObjectId(investment_id);
    }

    if (investment_type) {
      match.investment_type = normalizeTradeType(investment_type);
    }

    if (from || to) {
      match.sell_price_date = { ...match.sell_price_date };
      if (from) {
        match.sell_price_date.$gte = new Date(from);
      }
      if (to) {
        match.sell_price_date.$lte = new Date(to);
      }
    }

    const bucketExpression = {
      $dateToString: {
        format: HISTORY_FORMATS[filter],
        date: "$sell_price_date",
        timezone,
      },
    };

    const history = await Investment.aggregate([
      { $match: match },
      {
        $addFields: {
          total_buy_amount: { $round: [{ $multiply: ["$buy_price", "$quantity"] }, 2] },
          total_sell_amount: {
            $round: [{ $multiply: ["$sell_price", "$quantity"] }, 2],
          },
        },
      },
      {
        $addFields: {
          profit_loss: {
            $round: [{ $subtract: ["$total_sell_amount", "$total_buy_amount"] }, 2],
          },
        },
      },
      {
        $group: {
          _id: bucketExpression,
          period_end: { $max: "$sell_price_date" },
          total_buy_amount: { $sum: "$total_buy_amount" },
          total_sell_amount: { $sum: "$total_sell_amount" },
          total_profit_loss: { $sum: "$profit_loss" },
          trades_count: { $sum: 1 },
          profit_trades_count: {
            $sum: { $cond: [{ $gte: ["$profit_loss", 0] }, 1, 0] },
          },
          loss_trades_count: {
            $sum: { $cond: [{ $lt: ["$profit_loss", 0] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          period: "$_id",
          period_end: 1,
          total_buy_amount: { $round: ["$total_buy_amount", 2] },
          total_sell_amount: { $round: ["$total_sell_amount", 2] },
          total_profit_loss: { $round: ["$total_profit_loss", 2] },
          roi: {
            $cond: [
              { $gt: ["$total_buy_amount", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$total_profit_loss", "$total_buy_amount"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },
          trades_count: 1,
          profit_trades_count: 1,
          loss_trades_count: 1,
        },
      },
      { $sort: { period_end: 1 } },
    ]);

    return res.status(200).json({
      status: true,
      filter,
      timezone,
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
