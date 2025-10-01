require("dotenv").config();
const express = require("express");
const app = express();
const contributeRoute = require("./routes/contribute");

app.use(express.json());
app.use("/api/contribute", contributeRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});