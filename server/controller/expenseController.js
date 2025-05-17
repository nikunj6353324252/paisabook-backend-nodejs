import cloudinary from "../Config/CloudinaryConfig.js";
import Budget from "../model/budgetModel.js";
import Expense from "../model/expenseModel.js";
import path from "path";

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

    // let uploadedImage = null;
    // if (req.file) {
    //   const base64Image = `data:${
    //     req.file.mimetype
    //   };base64,${req.file.buffer.toString("base64")}`;
    //   uploadedImage = await cloudinary.uploader.upload(base64Image, {
    //     folder: "expense_bills",
    //   });
    // }

    let uploadedFile = null;
    if (req.file) {
      const fileBuffer = req.file.buffer;
      const fileMimeType = req.file.mimetype;
      const originalName = req.file.originalname;
      const fileExt = path.extname(originalName);

      const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
        "application/pdf",
      ];

      if (!allowedMimeTypes.includes(fileMimeType)) {
        return res.status(400).json({
          status: false,
          message: "Only image and PDF files are allowed",
        });
      }

      const base64File = `data:${fileMimeType};base64,${fileBuffer.toString(
        "base64"
      )}`;

      const fileName = `${Date.now()}_${Math.floor(
        Math.random() * 1000
      )}${fileExt}`;

      uploadedFile = await cloudinary.uploader.upload(base64File, {
        folder: "expense_bills",
        resource_type: fileMimeType === "application/pdf" ? "raw" : "auto",
        public_id: fileName.replace(/\.[^/.]+$/, ""),
        use_filename: true,
        unique_filename: false,
      });
    }

    const newExpense = await Expense.create({
      amount,
      description,
      date,
      budget_category,
      user_id,
      max_threshold,
      isImage: req.file.mimetype === "application/pdf" ? false : true,
      attachment_bill: uploadedFile?.secure_url || "",
      attachment_public_id: uploadedFile?.public_id || "",
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

// const updateExpense = async (req, res) => {
//   try {
//     const { id } = req.query;
//     const {
//       user_id,
//       amount,
//       description = "",
//       date,
//       budget_category = "",
//       max_threshold,
//     } = req.body;

//     if (!id || !user_id || !amount || !date) {
//       return res.status(400).json({
//         status: false,
//         message: "Fields 'id', 'user_id', 'amount', and 'date' are required",
//       });
//     }

//     const existingExpense = await Expense.findOne({ _id: id, user_id });
//     if (!existingExpense) {
//       return res.status(404).json({
//         status: false,
//         message: "Expense not found or unauthorized",
//       });
//     }

//     const oldCategory = existingExpense.budget_category;
//     const newCategory = budget_category;

//     const oldAmount = parseFloat(existingExpense.amount);
//     const newAmount = parseFloat(amount);

//     // Handle category change
//     if (oldCategory !== newCategory) {
//       if (oldCategory) {
//         const oldBudget = await Budget.findOne({
//           user_id,
//           budget_category: oldCategory,
//         });
//         if (oldBudget) {
//           oldBudget.spend = Math.max(0, oldBudget.spend - oldAmount);
//           await oldBudget.save();
//         }
//       }

//       if (newCategory) {
//         const newBudget = await Budget.findOne({
//           user_id,
//           budget_category: newCategory,
//         });
//         if (newBudget) {
//           newBudget.spend += newAmount;
//           await newBudget.save();
//         }
//       }
//     } else if (newCategory) {
//       const budget = await Budget.findOne({
//         user_id,
//         budget_category: newCategory,
//       });
//       if (budget) {
//         const delta = newAmount - oldAmount;
//         const updatedSpend = budget.spend + delta;

//         if (updatedSpend > budget.budget_limit) {
//           return res.status(400).json({
//             status: false,
//             message: "Updated expense exceeds budget limit",
//             data: {
//               usage: updatedSpend / budget.budget_limit,
//               remain: budget.budget_limit - updatedSpend,
//             },
//           });
//         }

//         budget.spend = updatedSpend;
//         await budget.save();
//       }
//     }

//     let updatedData = {
//       amount: newAmount,
//       description,
//       date,
//       budget_category: newCategory,
//       max_threshold,
//       isImage: req.file.mimetype === "application/pdf" ? false : true,
//     };

//     let attach_reciept = existingExpense.attach_reciept || "";
//     let attachment_public_id = existingExpense.attachment_public_id || "";
//     let isImage = existingExpense.isImage || false;

//     if (req.file) {
//       const fileBuffer = req.file.buffer;
//       const fileMimeType = req.file.mimetype;
//       const originalName = req.file.originalname;
//       const fileExt = path.extname(originalName);

//       const allowedMimeTypes = [
//         "image/jpeg",
//         "image/png",
//         "image/jpg",
//         "image/webp",
//         "application/pdf",
//       ];

//       if (!allowedMimeTypes.includes(fileMimeType)) {
//         return res.status(400).json({
//           status: false,
//           message: "Only image and PDF files are allowed",
//         });
//       }

//       if (attachment_public_id) {
//         await cloudinary.uploader.destroy(attachment_public_id, {
//           resource_type: isImage ? "image" : "raw",
//         });
//       }

//       const base64File = `data:${fileMimeType};base64,${fileBuffer.toString(
//         "base64"
//       )}`;
//       const fileName = `${Date.now()}_${Math.floor(
//         Math.random() * 1000
//       )}${fileExt}`;

//       const uploadedFile = await cloudinary.uploader.upload(base64File, {
//         folder: "expense_bills",
//         resource_type: fileMimeType === "application/pdf" ? "raw" : "auto",
//         public_id: fileName.replace(/\.[^/.]+$/, ""),
//         use_filename: true,
//         unique_filename: false,
//       });

//       attach_reciept = uploadedFile.secure_url;
//       attachment_public_id = uploadedFile.public_id;
//       isImage = fileMimeType !== "application/pdf";

//       updatedData.attach_reciept = attach_reciept;
//       updatedData.attachment_public_id = attachment_public_id;
//       updatedData.isImage = isImage;
//     }

//     const updatedExpense = await Expense.findOneAndUpdate(
//       { _id: id, user_id },
//       updatedData,
//       { new: true }
//     );

//     return res.status(200).json({
//       status: true,
//       message: "Expense updated successfully",
//       expense: updatedExpense,
//     });
//   } catch (error) {
//     console.error("Update expense error:", error);
//     return res.status(500).json({
//       status: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

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

    const oldCategory = existingExpense.budget_category;
    const newCategory = budget_category;
    const oldAmount = parseFloat(existingExpense.amount);
    const newAmount = parseFloat(amount);

    if (oldCategory !== newCategory) {
      if (oldCategory) {
        const oldBudget = await Budget.findOne({
          user_id,
          budget_category: oldCategory,
        });
        if (oldBudget) {
          oldBudget.spend = Math.max(0, oldBudget.spend - oldAmount);
          await oldBudget.save();
        }
      }

      if (newCategory) {
        const newBudget = await Budget.findOne({
          user_id,
          budget_category: newCategory,
        });
        if (newBudget) {
          newBudget.spend += newAmount;
          await newBudget.save();
        }
      }
    } else if (newCategory) {
      const budget = await Budget.findOne({
        user_id,
        budget_category: newCategory,
      });
      if (budget) {
        const delta = newAmount - oldAmount;
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
      amount: newAmount,
      description,
      date,
      budget_category: newCategory,
      max_threshold,
      isImage: req.file
        ? req.file.mimetype !== "application/pdf"
        : existingExpense.isImage,
    };

    let attachment_bill = existingExpense.attachment_bill || "";
    let attachment_public_id = existingExpense.attachment_public_id || "";
    let isImage = existingExpense.isImage || false;

    if (req.file && req.file.buffer) {
      const fileBuffer = req.file.buffer;
      const fileMimeType = req.file.mimetype;
      const originalName = req.file.originalname;
      const fileExt = path.extname(originalName);

      const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
        "application/pdf",
      ];

      if (!allowedMimeTypes.includes(fileMimeType)) {
        return res.status(400).json({
          status: false,
          message: "Only image and PDF files are allowed",
        });
      }

      if (attachment_public_id) {
        await cloudinary.uploader.destroy(attachment_public_id, {
          resource_type: isImage ? "image" : "raw",
        });
      }

      const base64File = `data:${fileMimeType};base64,${fileBuffer.toString(
        "base64"
      )}`;
      const fileName = `${Date.now()}_${Math.floor(
        Math.random() * 1000
      )}${fileExt}`;

      const uploadedFile = await cloudinary.uploader.upload(base64File, {
        folder: "expense_bills",
        resource_type: fileMimeType === "application/pdf" ? "raw" : "auto",
        public_id: fileName.replace(/\.[^/.]+$/, ""),
        use_filename: true,
        unique_filename: false,
      });

      attachment_bill = uploadedFile.secure_url;
      attachment_public_id = uploadedFile.public_id;
      isImage = fileMimeType !== "application/pdf";

      updatedData.attachment_bill = attachment_bill;
      updatedData.attachment_public_id = attachment_public_id;
      updatedData.isImage = isImage;
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
      await cloudinary.uploader.destroy(expense.attachment_public_id, {
        resource_type: expense.isImage ? "image" : "raw",
      });
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
