const { ObjectId } = require("mongodb");
const db = require("../utils/database");
const bcrypt = require("bcrypt");
var currentdate = new Date();
var date = currentdate.toLocaleDateString();
const year = 2022; // Replace with the desired year
const moment = require("moment");

module.exports = {
  adminlogin: async (sort) => {
    if (sort == "monthly") {
      const result = await db.order.aggregate([
        {
          $match: {
            orderDate: {
              $gte: new Date(moment().subtract(1, "months").startOf("month")),
              $lt: new Date(moment().subtract(1, "months").endOf("month")),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$orderDate" },
              month: { $month: "$orderDate" },
              day: { $dayOfMonth: "$orderDate" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            days: {
              $push: {
                year: "$_id.year",
                month: "$_id.month",
                day: "$_id.day",
                count: "$count",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            days: {
              $map: {
                input: {
                  $range: [
                    1,
                    moment().subtract(1, "months").endOf("month").date(),
                  ],
                },
                as: "day",
                in: {
                  year: moment().subtract(1, "months").year(),
                  month: moment().subtract(1, "months").month() + 1,
                  day: "$$day",
                  count: {
                    $let: {
                      vars: {
                        matchingDay: {
                          $filter: {
                            input: "$days",
                            as: "dayCount",
                            cond: {
                              $and: [
                                {
                                  $eq: [
                                    "$$dayCount.year",
                                    moment().subtract(1, "months").year(),
                                  ],
                                },
                                {
                                  $eq: [
                                    "$$dayCount.month",
                                    moment().subtract(1, "months").month() + 1,
                                  ],
                                },
                                { $eq: ["$$dayCount.day", "$$day"] },
                              ],
                            },
                          },
                        },
                      },
                      in: {
                        $cond: {
                          if: { $gt: [{ $size: "$$matchingDay" }, 0] },
                          then: { $arrayElemAt: ["$$matchingDay.count", 0] },
                          else: 0,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ]);
      let period;
      console.log(result[0].days);
      let data = result[0].days;
      return { period: "monthly", data: data };
    } else {
      const result = await db.order.aggregate([
        {
          $match: {
            orderDate: { $exists: true },
          },
        },
        {
          $group: {
            _id: {
              month: { $month: "$orderDate" },
              year: { $year: "$orderDate" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.year",
            counts: {
              $push: {
                month: "$_id.month",
                count: "$count",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id",
            counts: {
              $concatArrays: [
                {
                  $filter: {
                    input: [
                      { month: 1, count: 0 },
                      { month: 2, count: 0 },
                      { month: 3, count: 0 },
                      { month: 4, count: 0 },
                      { month: 5, count: 0 },
                      { month: 6, count: 0 },
                      { month: 7, count: 0 },
                      { month: 8, count: 0 },
                      { month: 9, count: 0 },
                      { month: 10, count: 0 },
                      { month: 11, count: 0 },
                      { month: 12, count: 0 },
                    ],
                    as: "missing",
                    cond: {
                      $not: {
                        $anyElementTrue: {
                          $map: {
                            input: "$counts",
                            as: "count",
                            in: { $eq: ["$$count.month", "$$missing.month"] },
                          },
                        },
                      },
                    },
                  },
                },
                "$counts",
              ],
            },
          },
        },
        {
          $unwind: "$counts",
        },
        {
          $replaceRoot: {
            newRoot: {
              year: "$year",
              month: "$counts.month",
              count: "$counts.count",
            },
          },
        },
        {
          $sort: {
            year: 1,
            month: 1,
          },
        },
      ]);

      const totalDeliveredOrders = await db.order.aggregate([
        {
          $match: {
            status: "delivered",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$total",
            },
          },
        },
      ]);
      const Orders = await db.order.find()
      const totalorders=Orders.length
      const Products = await db.product.find()
      const totalproducts=Products.length
      let period;
      console.log(result);
      const totalOfTotals = totalDeliveredOrders.length > 0 ? totalDeliveredOrders[0].total : 0;
      return {
        period: "yearly",
        data: result,
        total: totalOfTotals,
        orders:totalorders,
        products:totalproducts
      };
    }
  },
  addProduct: (productData, filename) => {
    console.log(productData);
    return new Promise(async (resolve, reject) => {
      if (productData.discountprice == 0) {
        data = new db.product({
          Productname: productData.name,
          ProductDescription: productData.description,
          Brand: productData.brand,
          Color: productData.color,
          Quantity: productData.quantity,
          Image: filename,
          Price: productData.price,
          Category: productData.category,
        });
      } else {
        data = new db.product({
          Productname: productData.name,
          ProductDescription: productData.description,
          Quantity: productData.quantity,
          Brand: productData.brand,
          Color: productData.color,
          Image: filename,
          Firstprice: productData.price,
          Price: productData.price - productData.discountprice,
          Category: productData.category,
        });
      }
      const Data = await data.save();
      const category = await db.category.findOne({
        Categoryname: productData.category,
      });
      if (category.offer !== 0) {
        const newprice = data.Price - category.offer;
        await db.product.updateOne(
          { _id: Data._id },
          { $set: { Price: newprice } }
        );
      }
      resolve();
    });
  },
  getViewProducts: () => {
    return new Promise(async (resolve, reject) => {
      await db.product.find().then((response) => {
        resolve(response);
      });
    });
  },
  deleteProduct: (productId) => {
    var g;
    console.log(productId);
    return new Promise(async (resolve, reject) => {
      await db.product
        .updateOne({ _id: productId }, { $set: { isDeleted: true } })
        .then();
      resolve();
    });
  },
  publishProduct: (productId) => {
    console.log(productId);
    return new Promise(async (resolve, reject) => {
      await db.product
        .updateOne({ _id: productId }, { $set: { isDeleted: false } })
        .then();
      resolve();
    });
  },
  postAddcategory: (categoryData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      const regex = new RegExp(categoryData.categoryname, "i");
      let existing = await db.category.findOne({ Categoryname: regex });
      if (existing) {
        resolve(true);
      } else {
        category = new db.category({
          Categoryname: categoryData.categoryname,
          offer: categoryData.categorydiscount,
          Description: categoryData.categorydiscription,
        });
        await category.save();
        resolve(false);
      }
    });
  },
  showUsers: () => {
    return new Promise(async (resolve, reject) => {
      await db.user.find().then((users) => {
        resolve(users);
      });
    });
  },
  blockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db.user.updateOne({ _id: userId }, { $set: { blocked: true } });
      resolve();
    });
  },
  blockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db.user.updateOne({ _id: userId }, { $set: { blocked: true } });
      resolve();
    });
  },
  unblockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db.user.updateOne({ _id: userId }, { $set: { blocked: false } });
      resolve();
    });
  },
  showAddproduct: () => {
    return new Promise(async (resolve, reject) => {
      await db.category.find().then((cat) => {
        console.log(cat);
        resolve(cat);
      });
    });
  },
  showAddcategory: () => {
    return new Promise(async (resolve, reject) => {
      await db.category.find().then((cat) => {
        resolve(cat);
      });
    });
  },
  deleteCategory: (Id) => {
    return new Promise(async (resolve, reject) => {
      await db.category
        .updateOne({ _id: Id }, { $set: { listed: false } })
        .then(() => {
          resolve();
        });
    });
  },
  showeditProduct: (Id) => {
    return new Promise(async (resolve, reject) => {
      await db.product.findOne({ _id: Id }).then((productdata) => {
        resolve(productdata);
      });
    });
  },
  showcatData: () => {
    return new Promise(async (resolve, reject) => {
      await db.category.find().then((catData) => {
        resolve(catData);
      });
    });
  },
  posteditProduct: (Id, editedData, imagedata) => {
    let update = {};
    if (imagedata && imagedata.length > 0) {
      update.Image = imagedata;
    }

    return new Promise(async (resolve, reject) => {
      await db.product
        .updateOne(
          { _id: Id },
          {
            Productname: editedData.name,
            ProductDescription: editedData.description,
            Brand: editedData.brand,
            Color: editedData.color,
            Quantity: editedData.quantity,
            ...update,
            Price: editedData.price,
            Category: editedData.category,
          }
        )
        .then();
      resolve();
    });
  },
  postLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginstatus = false;
      let response = {};
      let admin = await db.user.findOne({
        email: userData.email,
        isAdmin: true,
      });
      if (admin) {
        bcrypt.compare(userData.password, admin.password).then((status) => {
          if (status) {
            console.log("loginsucces");
            response.admin = admin;
            response.status = true;
            resolve(response);
          } else {
            console.log("loginFailed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("login failed");
        resolve({ status: false });
      }
    });
  },
  viewOrders: async () => {
    const orders = await db.order.find().populate("userId");
    return orders;
  },
  cancelOrder: async (orderId) => {
    await db.order.updateOne(
      { _id: orderId },
      { $set: { status: "cancelled" } }
    );
    return;
  },
  shipOrder: async (orderId) => {
    await db.order.updateOne({ _id: orderId }, { $set: { status: "shipped" } });
    return;
  },
  deliverOrder: async (orderId) => {
    await db.order.updateOne(
      { _id: orderId },
      { $set: { status: "delivered", paymentstatus: "paid" } }
    );
    return;
  },
  approveReturn: async (userId, amount, orderId) => {
    const total = parseInt(amount);
    await db.order.updateOne(
      { _id: orderId },
      { $set: { paymentstatus: "refunded" } }
    );
    const wallet = await db.wallet.findOne({ userId: userId });
    if (wallet) {
      const newbalance = wallet.balance + total;
      await db.wallet.updateOne(
        { userId: userId },
        { $set: { balance: newbalance } }
      );
    } else {
      newwallet = new db.wallet({
        userId: userId,
        balance: total,
      });
      await newwallet.save();
    }
  },
  viewCoupen: async () => {
    const coupen = await db.coupen.find();
    return coupen;
  },
  addcoupen: async (data) => {
    coupen = new db.coupen({
      coupencode: data.coupencode,
      expirydate: data.expirydate,
      discount: data.discount,
      coupentitle: data.title,
    });
    await coupen.save();
  },
  orderDetails: async (orderId) => {
    const order = await db.order
      .findOne({ _id: orderId })
      .populate("products.productId")
      .exec();
    const product = order.products.map(({ productId, quantity }) => ({
      _id: productId._id,
      name: productId.Productname,
      price: productId.Price,
      quantity: quantity,
      total: quantity * productId.Price,
      image: productId.Image,
      category: productId.Category,
    }));
    return { order, product };
  },
  viewSales: async (filter) => {
    try {
      if (filter.from) {
        const fromDate = new Date(filter.from);
        const toDate = new Date(filter.to);
        console.log(fromDate);
        const orders = await db.order
          .find({
            orderDate: {
              $gte: fromDate,
              $lte: toDate,
            },
            status: "delivered",
          })
          .populate("userId")
          .exec();

        console.log(orders);
        return orders;
      } else {
        const Orders = await db.order
          .find({ status: "delivered" })
          .populate("userId");
        return Orders;
      }
    } catch (err) {
      console.error(err);
      throw new Error("Error finding orders.");
    }
  },
  showEditcategory: async (catId) => {
    const catdata = await db.category.findOne({ _id: catId });
    return catdata;
  },
  postEditcategory: async (catId, catdata) => {
    await db.category.updateOne(
      { _id: catId },
      {
        $set: {
          Categoryname: catdata.categoryname,
          Description: catdata.categorydescription,
          offer: catdata.categorydiscount,
        },
      }
    );
    return;
  },
  listCategory: async (catId) => {
    await db.category.updateOne({ _id: catId }, { $set: { listed: true } });
    return;
  },
  editCoupen: async (coupenId) => {
    let Coupen = await db.coupen.findOne({ _id: coupenId });
    return Coupen;
  },
  posteditCoupen: async (editeddata, coupenId) => {
    const updateObj = {
      coupencode: editeddata.coupencode,
      discount: editeddata.discount,
      coupentitle: editeddata.title,
    };
    if (editeddata.expirydate) {
      updateObj.expirydate = editeddata.expirydate;
    }
    await db.coupen.updateOne({ _id: coupenId }, { $set: updateObj });
    return;
  },
  deleteCoupen: async (coupenId) => {
    let Coupen = await db.coupen.deleteOne({ _id: coupenId });
    return;
  },
};
