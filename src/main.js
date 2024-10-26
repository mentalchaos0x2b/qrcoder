const express = require("express");
const app = express();
const path = require("path");
const fileUpload = require("express-fileupload");

const fs = require("fs");

const crypto = require("crypto");

const qrcode = require("qrcode");

require("dotenv").config();

const CONFIG = {
  HOST: process.env.HOST || "localhost",
  PORT: process.env.PORT || 8080,
  HOSTING: process.env.HOSTING === "true" || false,
};

app.use(express.json());

app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(fileUpload());

app.use(express.static(path.join(__dirname, "../", "/static")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/index.html"));
});

app.get("/qr", (req, res) => {
  const { data } = req.query;

  if (!data) return res.status(400).json({ message: "data is required" });

  qrcode.toDataURL(data, (err, url) => {
    if (err) return res.status(500).json({ message: "server error" });

    const img_data = url.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(img_data, "base64");

    const hash = crypto.createHash("md5").update(url).digest("hex");

    const file_name = `${hash}_${Date.now().toString().split("Z")[0]}.png`;

    const full_path = path.join(__dirname, "../static/generated/", file_name);

    fs.writeFileSync(full_path, buffer);

    res.json({ image: url, link: "/generated/" + file_name });
  });
});

app.post("/qr/base64", (req, res) => {
  const { file } = req.files;

  if (!file) return res.status(400).json({ message: "file is required" });

  const file_name =
    crypto.createHash("md5").update(file.name).digest("hex") +
    "_" +
    file.name.replace(" ", "_");

  file.mv(path.join(__dirname, "../static/files/", file_name), (err) => {
    if (err) return res.status(500).json({ message: "server error" });
  });

  const full_file_url = CONFIG.HOSTING
    ? `http://${CONFIG.HOST}/files/${file_name}`
    : `http://${CONFIG.HOST}:${CONFIG.PORT}/files/${file_name}`;

  qrcode.toDataURL(full_file_url, (err, url) => {
    if (err) return res.status(500).json({ message: "server error" });

    const img_data = url.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(img_data, "base64");

    const hash = crypto.createHash("md5").update(url).digest("hex");

    const file_name_qr = `${hash}_${Date.now().toString().split("Z")[0]}.png`;

    const full_path = path.join(
      __dirname,
      "../static/generated/",
      file_name_qr
    );

    fs.writeFileSync(full_path, buffer);

    res.json({ image: url, link: "/generated/" + file_name_qr });
  });
});

app.get("/storage/clear", (req, res) => {
  try {
    const generated_dir = fs.readdirSync(
      path.join(__dirname, "../static/generated")
    );

    generated_dir.forEach((file) => {
      if (file !== "generated")
        fs.unlinkSync(path.join(__dirname, "../static/generated/", file));
    });
  } catch (err) {
    return res.status(500).json({ message: "server error" });
  }

  try {
    const files_dir = fs.readdirSync(path.join(__dirname, "../static/files"));

    files_dir.forEach((file) => {
      if (file !== "files")
        fs.unlinkSync(path.join(__dirname, "../static/files/", file));
    });
  } catch (err) {
    return res.status(500).json({ message: "server error" });
  }

  res.json({ message: "OK" });
});

app.get("/storage/info", (req, res) => {
  try {
    const generated_dir = fs.readdirSync(
      path.join(__dirname, "../static/generated")
    );
    const files_dir = fs.readdirSync(path.join(__dirname, "../static/files"));

    let general_size = 0;

    generated_dir.forEach((file) => {
      if (file !== "generated")
        general_size += fs.statSync(
          path.join(__dirname, "../static/generated/", file)
        ).size;
    });

    files_dir.forEach((file) => {
      if (file !== "files")
        general_size += fs.statSync(
          path.join(__dirname, "../static/files/", file)
        ).size;
    });

    res.json({
      message: "OK",
      size: Math.round(general_size / 1024 / 1024) + "Mb",
    });
  } catch (err) {
    return res.status(500).json({ message: "server error" });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "/404.html"));
});

if (!CONFIG.HOSTING) {
  app.listen(CONFIG.PORT, CONFIG.HOST, () => {
    console.log(`http://${CONFIG.HOST}:${CONFIG.PORT}/`);
  });
} else app.listen(80);
