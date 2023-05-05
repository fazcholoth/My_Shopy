const bcrypt = require("bcrypt");
const db = require("../models/model");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const { product } = require("../models/model");
const { response } = require("express");
const twilio = require("../utils/twilio");
const Razorpay = require("razorpay");
const { resolve } = require("dns");
const generateInvoice = require("../utils/pdf");
const { error } = require("console");
var currentdate = new Date();
var date = currentdate.toLocaleDateString();

var instance = new Razorpay({
  key_id: "rzp_test_djoEuAhlh9AKso",
  key_secret: "F3Z5bX8tNplaf2n3frYq6Ei6",
});

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 10);
      const data = {
        name: userData.username,
        password: userData.password,
        email: userData.email,
        phone: userData.phonenumber,
      };
      await db.user.create(data);
      resolve(data);
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginstatus = false;
      let response = {};
      let users = await db.user.findOne(
        { email: userData.email },
        { blocked: false }
      );
      if (users) {
        bcrypt.compare(userData.password, users.password).then((status) => {
          if (status) {
            response.user = users;
            response.status = true;
            resolve(response);
          } else {
            resolve({ status: false });
          }
        });
      } else {
        console.log("login failed");
        resolve({ status: false });
      }
    });
  },
  getHome: (page) => {
    const itemsperPage = 8;
    const currentpage = page || 1;
    console.log(page);
    const offset = (currentpage - 1) * itemsperPage;
    return new Promise(async (resolve, reject) => {
      const allproducts = await db.product
        .find({ isDeleted: false })
        .countDocuments();
      const totalpages = Math.ceil(allproducts / itemsperPage);
      await db.product
        .find({ isDeleted: false })
        .skip(offset)
        .limit(itemsperPage)
        .exec()
        .then((prodata) => {
          resolve({ totalpages, prodata, currentpage });
        });
    });
  },
  productDetails: (Id) => {
    return new Promise(async (resolve, reject) => {
      await db.product.findOne({ _id: Id }).then((productdata) => {
        resolve(productdata);
      });
    });
  },
  addtoCart: async (userId, productId) => {
    try {
      let product = await db.product.findOne({ _id: productId });
      if (product.Quantity > 0) {
        const existing = await db.cart.findOne(
          {
            userId: userId,
            "products.productId": productId,
          },
          { "products.$": 1 }
        );
        if (existing) {
          if (existing.products[0].quantity < product.Quantity) {
            await db.cart.updateOne(
              { userId: userId, "products.productId": productId },
              { $inc: { "products.$.quantity": 1 } },
              { new: true }
            );
            return "existing";
          } else {
            return "limit reached";
          }
        } else {
          await db.cart.updateOne(
            { userId: userId },
            { $push: { products: { productId: productId, quantity: 1 } } },
            { upsert: true }
          );
          return "non existing";
        }
      } else {
        return "out of stock";
      }
    } catch (err) {
      console.error(err);
    }
  },
  getCart: async (userId) => {
    const cart = await db.cart
      .findOne({ userId: userId })
      .populate("products.productId")
      .exec();
    if (cart) {
      const product = cart.products.map(({ productId, quantity }) => ({
        _id: productId._id,
        name: productId.Productname,
        price: productId.Price,
        quantity: quantity,
        total: quantity * productId.Price,
        image: productId.Image,
        category: productId.Category,
      }));

      let subtotal = 0;
      product.forEach((item) => {
        subtotal += item.total;
      });
      const cartId = cart._id;
      return {
        product,
        subtotal,
        cartId,
      };
    } else {
      return {
        product: [],
        subtotal: null,
        cartId: null,
      };
    }
  },
  getCartcount: (UserId) => {
    return new Promise(async (resolve, reject) => {
      try {
        var count = 0;
        let Cart = await db.cart.findOne({ userId: UserId });

        if (Cart && Cart.products) {
          count = Cart.products.length;
        }
        resolve(count);
      } catch (err) {
        console.error(err);
        reject(err);
      }
    });
  },
  changeQuantity: (proid, cartid, count, quantity) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (count == -1 && quantity == 1) {
          db.cart
            .updateOne(
              { _id: cartid },
              { $pull: { products: { productId: proid } } }
            )
            .then((response) => {
              resolve({ removeProduct: true });
            });
        }
        let product = await db.product.findOne({ _id: proid });
        const cart = await db.cart.findOne(
          {
            _id: cartid,
            "products.productId": proid,
          },
          { "products.$": 1 }
        );
        if (cart.products[0].quantity < product.Quantity) {
          await db.cart
            .updateOne(
              { _id: cartid, "products.productId": proid },
              { $inc: { "products.$.quantity": count } },
              { new: true }
            )
            .then((response) => {
              resolve(true);
            });
        } else if (
          cart.products[0].quantity === product.Quantity &&
          count == -1
        ) {
          await db.cart
            .updateOne(
              { _id: cartid, "products.productId": proid },
              { $inc: { "products.$.quantity": count } },
              { new: true }
            )
            .then((response) => {
              resolve(true);
            });
        } else if (
          cart.products[0].quantity > product.Quantity &&
          count == -1
        ) {
          await db.cart
            .updateOne(
              { _id: cartid, "products.productId": proid },
              { $inc: { "products.$.quantity": count } },
              { new: true }
            )
            .then((response) => {
              resolve(true);
            });
        } else {
          resolve({ limitreached: true });
        }
      } catch (err) {
        console.error(err);
      }
    });
  },
  removeItem: async (userId, proId) => {
    const item = await db.cart.findOneAndUpdate(
      { userId: userId },
      { $pull: { products: { productId: proId } } },
      { new: true }
    );
    return item;
  },
  categoryView: (category, page) => {
    const itemsperPage = 8;
    const currentpage = page || 1;
    const offset = (currentpage - 1) * itemsperPage;
    return new Promise(async (resolve, reject) => {
      const allproducts = await db.product
        .find({ Category: category, isDeleted: false })
        .countDocuments();
      const totalpages = Math.ceil(allproducts / itemsperPage);
      await db.product
        .find({ Category: category, isDeleted: false })
        .skip(offset)
        .limit(itemsperPage)
        .exec()
        .then((products) => {
          resolve({ totalpages, products, currentpage });
        });
    });
  },
  listedCategories: () => {
    return new Promise(async (resolve, reject) => {
      await db.category
        .find({ listed: true })
        .exec()
        .then((category) => {
          resolve(category);
        });
    });
  },
  productCount: async (user, prodcuts) => {
    for (const item of prodcuts) {
      let items = await db.product.findOne({ _id: item.productId });
      if (item.quantity > items.Quantity) {
        let unavailable = [];
        unavailable.push({
          productName: items.Productname,
          quantity: items.Quantity,
        });
        return unavailable;
      }
    }
  },
  placeOrder: async (userId, products, address, total) => {
    let status = address.paymentmethod === "cash-on-delivery" ? true : false;
    const addressId = address.address;
    const deliveryAddress = await db.address.findOne({
      _id: addressId,
      userId: userId,
    });
    try {
      const newOrder = new db.order({
        userId: userId,
        products: products,
        total: total,
        status: "placed",
        paymentmethod: address.paymentmethod,
        orderDate: new Date(),
        Shippingadress: {
          name: deliveryAddress.name,
          street: deliveryAddress.street,
          city: deliveryAddress.city,
          contry: deliveryAddress.country,
          postalcode: deliveryAddress.zipCode,
        },
      });
      const savedOrder = await newOrder.save();
      await db.cart.deleteMany({ userId: userId });
      for (const product of products) {
        const productdocument = await db.product.findOne({
          _id: product.productId,
        });
        const newquantity = productdocument.Quantity - product.quantity;
        await db.product.updateOne(
          { _id: product.productId },
          { $set: { Quantity: newquantity } }
        );
      }
      return savedOrder._id;
    } catch (error) {
      console.log(error.message);
      throw new Error("Error while saving order");
    }
  },
  generateRazorpay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: total * 100,
        currency: "INR",
        receipt: String(orderId),
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          reject(err);
        } else {
          resolve(order);
        }
      });
    });
  },
  findProducts: async (userId) => {
    cart = await db.cart.findOne({ userId: userId });
    return cart.products;
  },
  verifyNumber: async (phone) => {
    const phon = parseInt(phone);
    console.log(phon);
    const existing = await db.user.findOne({ phone: phon });
    if (existing) {
      twilio.sendOtp(phon);
      return true;
    } else {
      return false;
    }
  },
  postverifyOtp: async (phone, otp) => {
    const same = await twilio.verifyOtp(phone, otp);
    if (same === approved) {
      return true;
    } else {
      return false;
    }
  },
  findAddress: async (userId) => {
    const address = await db.address.find({ userId: userId });
    console.log(address);
    return address;
  },
  postaddAddress: async (address, users) => {
    address = new db.address({
      userId: users._id,
      name: users.name,
      street: address.street,
      city: address.city,
      country: address.contry,
      zipCode: address.pincode,
      phone: address.phone,
    });
    const user = await address.save();
    await db.user.updateOne(
      { _id: users._id },
      { $push: { adress: user._id } }
    );
    return;
  },
  otpVerified: async (phone) => {
    const user = await db.user.findOne({ phone: phone });
    return user;
  },
  viewOrders: async (userId) => {
    const orders = await db.order.find({ userId: userId });
    return orders;
  },
  viewOrderdetails: async (orderId) => {
    console.log(orderId);
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

    let subtotal = 0;
    product.forEach((item) => {
      subtotal += item.total;
    });
    return {
      product,
      subtotal,
    };
  },
  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "F3Z5bX8tNplaf2n3frYq6Ei6");
      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },
  changePaymentstatus: (orderId) => {
    return new Promise(async (resolve, reject) => {
      console.log(orderId);
      await db.order
        .updateOne(
          { _id: orderId },
          {
            $set: {
              status: "placed",
              paymentstatus: "paid",
            },
          }
        )
        .then((result) => {
          console.log(result);
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  cancelOrder: async (orderId, reason) => {
    try {
      console.log(orderId);
      await db.order.updateOne(
        { _id: orderId },
        { $set: { status: "cancelled", cancelreason: reason } }
      );
      return;
    } catch (err) {
      console.log(error);
    }
  },
  returnOrder: async (orderId, reason) => {
    await db.order.updateOne(
      { _id: orderId },
      {
        $set: {
          status: "returned",
          paymentstatus: "paid",
          returnreason: reason,
        },
      }
    );
    return;
  },
  applyCoupen: async (coupencode, subtotal) => {
    const coupen = await db.coupen.findOne({ coupencode: coupencode });
    const discount = coupen.discount;
    const total = subtotal - discount;
    return {
      discount,
      total,
    };
  },
  viewCoupen: async () => {
    const coupen = await db.coupen.find();
    return coupen;
  },
  searchProducts: async (query) => {
    const regex = new RegExp(query, "i");
    const prodcuts = await db.product.find({ Productname: regex });
    return prodcuts;
  },
  invoiceDownload: (orderId) => {
    return new Promise(async (resolve, reject) => {
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
      generateInvoice(order, product).then((filePath) => {
        resolve();
      });
    });
  },
  showeditAddress: async (addressId) => {
    const Address = await db.address.findOne({ _id: addressId });
    return Address;
  },
  posteditAddress: async (addressId, newdata, userId) => {
    await db.address.updateOne(
      { _id: addressId },
      {
        $set: {
          userId: userId,
          name: newdata.name,
          street: newdata.street,
          city: newdata.city,
          country: newdata.contry,
          zipCode: newdata.pincode,
          phone: newdata.phone,
        },
      }
    );
    return;
  },
  deleteAddress: async (addressId) => {
    await db.address.deleteOne({ _id: addressId });
    return;
  },
  viewallProducts: async (filter, sort, page) => {
    const itemsperPage = 2;
    const currentpage = page || 1;
    console.log("page..." + page);
    const offset = (currentpage - 1) * itemsperPage;

    const query = {};
    if (sort && sort === "desc") {
      if (filter && filter.color) {
        query.Color = filter.color;
      }
      if (filter && filter.category) {
        query.Category = filter.category;
      }
      if (filter && filter.brand) {
        query.Brand = filter.brand;
      }
      const allproducts = await db.product
        .find(query)
        .sort({ Price: -1 })
        .countDocuments();
      const totalpages = Math.ceil(allproducts / itemsperPage);
      let products = await db.product
        .find(query)
        .sort({ Price: -1 })
        .skip(offset)
        .limit(itemsperPage);

      return { products, totalpages, currentpage };
    } else if (sort && sort === "acent") {
      if (filter && filter.color) {
        query.Color = filter.color;
      }
      if (filter && filter.category) {
        query.Category = filter.category;
      }
      if (filter && filter.brand) {
        query.Brand = filter.brand;
      }
      const allproducts = await db.product
        .find(query)
        .sort({ Price: 1 })
        .countDocuments();
      const totalpages = Math.ceil(allproducts / itemsperPage);
      let products = await db.product
        .find(query)
        .sort({ Price: 1 })
        .skip(offset)
        .limit(itemsperPage);

      return { products, totalpages, currentpage };
    } else {
      if (filter && filter.color) {
        query.Color = filter.color;
      }
      if (filter && filter.category) {
        query.Category = filter.category;
      }
      if (filter && filter.brand) {
        query.Brand = filter.brand;
      }
      const allproducts = await db.product.find(query).countDocuments();
      const totalpages = Math.ceil(allproducts / itemsperPage);
      let products = await db.product
        .find(query)
        .sort({ Price: 1 })
        .skip(offset)
        .limit(itemsperPage);

      return { products, totalpages, currentpage };
    }
  },
  addtoWishlist: async (userId, productId) => {
    let exist = await db.wishlist.findOne({
      productIds: { $in: [productId] },
      userId: userId,
    });
  
    if (exist) {
      return "already added";
    } else {
     
      const item = await db.wishlist.updateOne(
        { userId: userId },
        { $push: { productIds: productId } },
        { upsert: true }
      ); 
    
      return "added";
      
    }
  }
  
  ,
  viewWishlist: async (userId) => {
    const wishlist = await db.wishlist.find();
    const wish = await db.wishlist
      .findOne({ userId: userId })
      .populate("productIds")
      .exec();
    if(wish.length>0){
      const products = wish.productIds.map(
        ({ _id, Productname, Price,Firstprice,Image, Category }) => ({
          _id: _id,
          name: Productname,
          Price: Price,
          Firstprice:Firstprice,
          quantity: 1, 
          total: Price, 
          image: Image,
          category: Category,
        })
      );
      console.log(products);
      return products;
    }else{
      let products =[]
      return products
    }
    
  },
};
