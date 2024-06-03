const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect("mongodb+srv://cheeman:9Bcts_2015@atlascluster.untqfzs.mongodb.net/Hellopay-Project?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const contractSchema = new mongoose.Schema({
    memberId: { type: String, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadDate: { type: Date, default: Date.now },
});

const Contract = mongoose.model("Contract", contractSchema);

app.post("/upload/contract", upload.single("contract"), async(req, res) => {
    const body = req.body;
    const file = req.file;

    if (!body.memberId || !file) {
        return res.status(400).json({
            data: {
                message: "MISSING_FIELDS",
                details: "Missing memberId or contract field",
            },
        });
    }

    const newContract = new Contract({
        memberId: body.memberId,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
    });

    try {
        await newContract.save();
        res.status(200).json({
            data: {
                message: "SUCCESS",
                details: "Successfully uploaded",
            },
        });
    } catch (error) {
        res.status(500).json({
            data: {
                message: "SERVER_ERROR",
                details: "An error occurred while saving the contract",
            },
        });
    }
});



app.get("/download/contract/:memberId", async(req, res) => {
    try {
        const memberId = req.params.memberId;
        const contract = await Contract.findOne({ memberId });

        if (!contract) {
            return res.status(404).json({
                data: {
                    message: "NOT_FOUND",
                    details: "No contract found for the provided memberId",
                },
            });
        }

        const filePath = path.resolve(contract.filePath);
        res.download(filePath, contract.fileName, (err) => {
            if (err) {
                res.status(500).json({
                    data: {
                        message: "SERVER_ERROR",
                        details: "An error occurred while downloading the file",
                    },
                });
            }
        });
    } catch (error) {
        res.status(500).json({
            data: {
                message: "SERVER_ERROR",
                details: "An error occurred while fetching the contract",
            },
        });
    }
});


app.listen(7500, () => console.log("Running on port 3000"));