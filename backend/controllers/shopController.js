import User from "../models/User.js";

export const getShop = async (req, res) => {
  try {
    let { shopCode } = req.params;
    if (!shopCode) {
      return res.status(400).json({ message: "Shop code is required" });
    }

    let cleanParam = shopCode;
    try {
      cleanParam = decodeURIComponent(cleanParam);
    } catch (e) {
      // keep raw param if decode fails
    }
    cleanParam = cleanParam.trim();

    // Escape regex characters
    const escapedParam = cleanParam.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const flexPattern = escapedParam.replace(/[-_\s]+/g, "[\\s-_]*");

    let shopNameRegex = null;
    try {
      shopNameRegex = new RegExp(`^${flexPattern}$`, "i");
    } catch (e) {
      shopNameRegex = null;
    }

    const queryConditions = [
      { shopCode: cleanParam.toUpperCase() },
      { shopCode: cleanParam },
    ];

    if (shopNameRegex) {
      queryConditions.push({ shopName: shopNameRegex });
    }

    const shop = await User.findOne(
      { $or: queryConditions },
      { shopName: 1, shopCode: 1 }
    );

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    return res.status(200).json({ shop });
  } catch (error) {
    console.error("getShop error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};