import cloudinary from "../Config/CloudinaryConfig.js";
import Income from "../model/incomeModel.js";
import path from "path";

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
    const { amount, description, date, income_category, user_id } = req.body;

    if (!amount || !date || !income_category || !user_id) {
      return res.status(400).json({
        status: false,
        message:
          "Fields 'amount', 'date', 'income_category', and 'user_id' are required",
      });
    }

    // let uploadedImage = null;
    // if (req.file) {
    //   const base64Image = `data:${
    //     req.file.mimetype
    //   };base64,${req.file.buffer.toString("base64")}`;
    //   uploadedImage = await cloudinary.uploader.upload(base64Image, {
    //     folder: "income_receipts",
    //   });
    // }

    let uploadedFile = null;
    if (req.file) {
      const fileBuffer = req.file.buffer;
      const fileMimeType = req.file.mimetype;
      const originalName = req.file.originalname;
      const fileExt = path.extname(originalName); // e.g., .pdf, .jpg

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
        folder: "income_receipts",
        resource_type: "auto",
        public_id: fileName.replace(/\.[^/.]+$/, ""),
        use_filename: true,
        unique_filename: false,
      });
    }

    const newIncome = await Income.create({
      amount,
      description,
      date,
      income_category,
      attach_reciept: uploadedFile?.secure_url || "",
      attachment_public_id: uploadedFile?.public_id || "",
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
      message: error.message,
      //   error: error.message,
    });
  }
};

const updateIncome = async (req, res) => {
  try {
    const { id } = req.query;
    const { amount, description, date, income_category, user_id } = req.body;

    if (!id || !user_id || !amount || !date || !income_category) {
      return res.status(400).json({
        status: false,
        message:
          "Fields 'id', 'user_id', 'amount', 'date', and 'income_category' are required",
      });
    }

    const existingIncome = await Income.findOne({ _id: id, user_id });
    if (!existingIncome) {
      return res.status(404).json({
        status: false,
        message: "Income not found or unauthorized",
      });
    }

    let attach_reciept = existingIncome.attach_reciept || "";
    let attachment_public_id = existingIncome.attachment_public_id || "";

    if (req.file) {
      if (attachment_public_id) {
        await cloudinary.uploader.destroy(attachment_public_id);
      }

      const base64Image = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
      const uploadedImage = await cloudinary.uploader.upload(base64Image, {
        folder: "income_receipts",
      });

      attach_reciept = uploadedImage.secure_url;
      attachment_public_id = uploadedImage.public_id;
    }

    const updatedIncome = await Income.findOneAndUpdate(
      { _id: id, user_id },
      {
        amount,
        description,
        date,
        income_category,
        attach_reciept,
        attachment_public_id,
      },
      { new: true }
    );

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

    const existingIncome = await Income.findOne({ _id: id, user_id });
    if (!existingIncome) {
      return res.status(404).json({
        status: false,
        message: "Income not found or unauthorized",
      });
    }

    if (existingIncome.attachment_public_id) {
      await cloudinary.uploader.destroy(existingIncome.attachment_public_id);
    }

    const deletedIncome = await Income.findOneAndDelete({ _id: id, user_id });

    return res.status(200).json({
      status: true,
      message: "Income and associated image (if any) deleted successfully",
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
