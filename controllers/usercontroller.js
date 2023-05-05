//const { response } = require('express')
const { response } = require("express");
const adminhelpers = require("../helpers/adminhelpers");
const { listedCategories } = require("../helpers/userhelper");
var userhelper = require("../helpers/userhelper");
const twilio = require("../utils/twilio");
const path = require("path");


module.exports = {
  getHome: async (req, res) => {
    let user = req.session.user;
    let cartcount = null;
    if (req.session.user) {
      cartcount = await userhelper.getCartcount(req.session.user._id);
    }
     const categories = await listedCategories();
    userhelper.getHome(req.query.page).then(({prodata,currentpage,totalpages}) => {
      console.log(totalpages);
      res.render("user/userhome", { user, prodata,currentpage,totalpages,cartcount,categories });
    });
  },
  showSignup: (req, res) => {
    res.render("user/usersignup");
  },
  postSignup: (req, res) => {
    userhelper.doSignup(req.body).then((response) => {
      req.session.user = response;
      req.session.loggedIn = true;
      res.redirect("/");
    });
  },
  showLogin: (req, res) => {
    if (req.session.loggedIn) {
      res.redirect("/");
    } else {
      res.render("user/userlogin", { loginError: req.session.loginError });
      req.session.loginError = null;
    }
  },
  postLogin: (req, res) => {
    userhelper.doLogin(req.body).then((response) => {
      if (response.status) {
        req.session.loggedIn = true;
        req.session.user = response.user;
        res.redirect("/");
      } else {
        req.session.loginError = "invalid email or password";
        res.redirect("/login");
      }
    });
  },
  userLogout: (req, res) => {
    req.session.destroy();
    res.redirect("/");
  },
  productDetails: async (req, res) => {
    let user = req.session.user;
    let cartcount = null;
    if (req.session.user) {
      cartcount = await userhelper.getCartcount(req.session.user._id);
    }
    const categories = await listedCategories();
    userhelper.productDetails(req.params.id).then((prodata) => {
      res.render("user/product-details", {
        prodata,
        user,
        cartcount,
        categories,
      });
    });
  },
  addtoCart: async (req, res) => {
    let userId = req.session.user._id;
    let status = await userhelper.addtoCart(userId, req.params.id);
    if (status == "existing") {
      res.json({ status: "existing" });
    } else if (status == "out of stock") {
      res.json({ status: "out of stock" });
    } else if (status == "limit reached") {
      res.json({ status: "limit reached" });
    } else {
      res.json({ status: "non existing" });
    }
  },
  getCart: async (req, res) => {
    let userId = req.session.user._id;
    let user = req.session.user;
    let cartcount = null;
    if (req.session.user) {
      cartcount = await userhelper.getCartcount(req.session.user._id);
    }
    let unavailable = null;
    const categories = await listedCategories();
    const cart = await userhelper.getCart(userId);
    const { product, subtotal, cartId } = cart;
    res.render("user/cart", {
      product,
      subtotal,
      cartId,
      cartcount,
      user,
      categories,
      unavailable,
    });
  },
  changeQuantity: (req, res) => {
    const { product, cart, count, quantity } = req.body;
    userhelper
      .changeQuantity(product, cart, count, quantity)
      .then((response) => {
        res.json(response);
      });
  },
  removeItem: async (req, res) => {
    let userId = req.session.user._id;
    let response = await userhelper.removeItem(userId, req.body.proid);
    res.json(response);
  },
  viewCheckout: async (req, res) => {
    let user = req.session.user;
    let cartcount = null;
    if (req.session.user) {
      cartcount = await userhelper.getCartcount(req.session.user._id);
    }
    const categories = await listedCategories();
    const products = await userhelper.findProducts(user._id);
    const unavailable = await userhelper.productCount(user, products);
    if (unavailable) {
      console.log(unavailable);
      const cart = await userhelper.getCart(user._id);
      const { product, subtotal, cartId } = cart;
      res.render("user/cart", {
        product,
        subtotal,
        cartId,
        cartcount,
        user,
        categories,
        unavailable,
      });
    } else {
      const { product, subtotal, cartId } = await userhelper.getCart(
        req.session.user._id
      );
      const addresses = await userhelper.findAddress(user._id);
      res.render("user/checkout", {
        cartcount,
        user,
        categories,
        product,
        subtotal,
        cartId,
        addresses,
      });
    }
  },
  categoryView: async (req, res) => {
    let user = req.session.user;
    let cartcount = null;
    if (req.session.user) {
      cartcount = await userhelper.getCartcount(req.session.user._id);
    }
    const categories = await listedCategories();
    userhelper.categoryView(req.params.category,req.query.page).then(({products,totalpages,currentpage}) => {
      console.log(totalpages);
      res.render("user/category", { products,totalpages,currentpage,cartcount, user, categories });
    });
  },
  placeOrder: async (req, res) => {
    let user = req.session.user;
    const products = await userhelper.findProducts(user._id);
    const orderId = await userhelper.placeOrder(
      user._id,
      products,
      req.body,
      req.body.total
    );
    if (orderId.status) {
      res.json({ product: orderId.item, balance: orderId.balance });
    } else {
      if (req.body.paymentmethod === "cash-on-delivery") {
        res.json({ codsuccess: true });
      } else {
        const response = await userhelper.generateRazorpay(
          orderId,
          req.body.total
        );
        console.log(response);
        res.json(response);
      }
    }
  },
  orderSuccess: async (req, res) => {
    let user = req.session.user;
    let cartcount = null;
    if (req.session.user) {
      cartcount = await userhelper.getCartcount(req.session.user._id);
    }
    const categories = await listedCategories();
    res.render("user/order-success", { user, categories, cartcount });
  },
  otpLogin: async (req, res) => {
    let user = req.session.user;
    let cartcount = null;
    if (req.session.user) {
      cartcount = await userhelper.getCartcount(req.session.user._id);
    }
    const categories = await listedCategories();
    res.render("user/enter-phonenumber", { categories, cartcount, user });
  },
  postOtplogin: async (req, res) => {
    let user = req.session.user;
    let cartcount = null;
    if (req.session.user) {
      cartcount = await userhelper.getCartcount(req.session.user._id);
    }
    const categories = await listedCategories();
    const response = await userhelper.verifyNumber(req.body.phone);
    req.session.phone = req.body.phone;

    if (response) {
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  },
  VerifyOtp: async (req, res) => {
    let user = req.session.user;
    let cartcount = null;
    if (req.session.user) {
      cartcount = await userhelper.getCartcount(req.session.user._id);
    }
    const categories = await listedCategories();
    res.render("user/enterotp", { user, cartcount, categories });
  },
  postverifyOtp: async (req, res) => {
    const phon = req.session.phone;
    const otp = req.body.otp;
    try {
      const same = await twilio.verifyOtp(phon, otp);
      if (same === "approved") {
        const response = await userhelper.otpVerified(phon);
        req.session.user = response;
        req.session.loggedIn = true;
        res.json({ status: true });
      } else {
        res.json({ status: false });
      }
    } catch (err) {
      console.error();
    }
  },
  addAddress: async (req, res) => {
    let user = req.session.user;
    let cartcount = null;
    if (req.session.user) {
      cartcount = await userhelper.getCartcount(req.session.user._id);
    }
    const categories = await listedCategories();
    res.render("user/add-address", { user, cartcount, categories });
  },
  postaddAddress: async (req, res) => {
    let users = req.session.user;
    await userhelper.postaddAddress(req.body, users);
    res.redirect("/check-out")
  },
  viewOrders: async (req, res) => {
    let user = req.session.user;
    let cartcount = null;
    if (req.session.user) {
      cartcount = await userhelper.getCartcount(req.session.user._id);
    }
    const categories = await listedCategories();
    const orders = await userhelper.viewOrders(user._id);
    res.render("user/view-orders", { user, cartcount, categories, orders });
  },
  viewOrderdetails: async (req, res) => {
    let user = req.session.user;
    let cartcount = null;
    let orderId = req.params.orderId;
    if (req.session.user) {
      cartcount = await userhelper.getCartcount(req.session.user._id);
    }
    const categories = await listedCategories();
    const { product, subtotal } = await userhelper.viewOrderdetails(orderId);
    res.render("user/order-details.ejs", {
      user,
      cartcount,
      categories,
      product,
      subtotal,
      orderId,
    });
  },
  verifyPayment: (req, res) => {
    userhelper
      .verifyPayment(req.body)
      .then(() => {
        const details = req.body;
        userhelper.changePaymentstatus(details["order[receipt]"]).then(() => {
          res.json({ status: true });
        });
      })
      .catch((err) => {
        console.log(err);
        res.json({ status: false });
      }); 
  },
  cancelOrder: async (req, res) => {
    const orderId = req.body.orderId;
    await userhelper.cancelOrder(orderId,req.body.reason);
    res.json({ status: true });
  },
  returnOrder: async (req, res) => {
    const orderId = req.body.orderId;
    await userhelper.returnOrder(orderId,req.body.reason);
    res.json({ status: true });
  },
  applyCoupen: async (req, res) => {
    let user = req.session.user;
    let userId = user._id;
    let coupencode = req.body.couponcode;
    var { subtotal } = await userhelper.getCart(userId);
    var { total, discount } = await userhelper.applyCoupen(
      coupencode,
      subtotal
    );
    res.json({ discount: discount, total: total });
  },
  viewCoupen: async (req, res) => {
    let user = req.session.user;
    let cartcount = null;
    if (req.session.user) {
      cartcount = await userhelper.getCartcount(req.session.user._id);
    }
    const categories = await listedCategories();
    const coupen = await userhelper.viewCoupen();
    res.render("user/coupens", { coupen, cartcount, user, categories });
  },
  searchProducts: async (req, res) => {
    let user = req.session.user;
    let cartcount = null;
    if (req.session.user) {
      cartcount = await userhelper.getCartcount(req.session.user._id);
    }
    const categories = await listedCategories();
    const products = await userhelper.searchProducts(req.body.searchword);
    console.log(products);
    res.render("user/category", { products, cartcount, user, categories });
  },
  resendOtp: async (req, res) => {
    let user = req.session.user;
    let cartcount = null;
    if (req.session.user) {
      cartcount = await userhelper.getCartcount(req.session.user._id);
    }
    const categories = await listedCategories();
    await userhelper.verifyNumber(req.session.phone);
    res.render("user/enterotp", { user, cartcount, categories });
  },
  invoiceDownload: (req, res) => {
    let orderId = req.params.orderId;
    userhelper.invoiceDownload(orderId).then(() => {
      const publicPath = path.join(__dirname, "..", "public");
      const filePath = path.join(
        publicPath,
        "invoices",
        `invoice_${orderId}.pdf`
      );
      const fileName = `invoice_${orderId}.pdf`;
      res.download(filePath, fileName, function (err) {
        console.log("download");
        if (err) {
          console.error(err);
          res.status(404).send("File not found");
        }
      });
    });
  },
  showeditAddress: async (req, res) => {
    let addressId = req.params.addressId;
    let user = req.session.user;
    let cartcount = null;
    if (req.session.user) {
      cartcount = await userhelper.getCartcount(req.session.user._id);
    }
    const categories = await listedCategories();
    let address = await userhelper.showeditAddress(addressId);
    res.render("user/editaddress", { user, cartcount, categories, address });
  },
  deleteAddress: async (req, res) => {
    let addressId = req.params.addressId;
    await userhelper.deleteAddress(addressId);
    res.redirect("/check-Out");
  },
  posteditAddress: async (req, res) => {
    let addressId = req.params.addressId;
    let userId = req.session.user._id;
    await userhelper.posteditAddress(addressId, req.body, userId);
    res.redirect("/check-Out");
  },
  viewProfile: async (req, res) => {
    let user = req.session.user;
    let cartcount = null;
    if (req.session.user) {
      cartcount = await userhelper.getCartcount(req.session.user._id);
    }
    const categories = await listedCategories();
    const orders = await userhelper.viewOrders(user._id);
    const cart = await userhelper.getCart(user._id);
    const { product, subtotal, cartId } = cart;
    const addresses = await userhelper.findAddress(user._id);
    console.log(addresses);
    res.render("user/profile", { user, cartcount, categories ,orders,product,subtotal,addresses});
  },
  viewallProducts: async (req, res) => {
    let user = req.session.user;
    let cartcount = null;
    if (req.session.user) {
      cartcount = await userhelper.getCartcount(req.session.user._id);
    }
    const categories = await listedCategories();
    const { color, category, brand, sort } = req.query;
    if (color || category || brand) {
      req.session.filter = req.query;
      userhelper.viewallProducts(req.session.filter, req.session.sort,req.query.page)

        .then(({currentpage,totalpages,products}) => {
          res.render("user/allproducts", {
            products,
            cartcount,
            user,
            categories,
            totalpages,
            currentpage
          });
        });
    } else if(sort){
    
      
      req.session.sort = req.query.sort;
      userhelper.viewallProducts(req.session.filter, req.session.sort,req.query.page)

        .then(({currentpage,totalpages,products}) => {
          res.render("user/allproducts", {
            products,
            cartcount,
            user,
            categories,
            totalpages,
            currentpage
          });
        });
    }else{
      userhelper.viewallProducts(req.session.filter, req.session.sort,req.query.page)
        .then(({currentpage,totalpages,products}) => {
          res.render("user/allproducts", {
            products,
            cartcount,
            user,
            categories,
            totalpages,
            currentpage
          });
        });
    }
  },
  addtoWishlist:async(req,res)=>{
    let userId = req.session.user._id;
    let status = await userhelper.addtoWishlist(userId, req.params.id);
    if (status=="added"){
      res.json({status:"added"})
    }else{
      res.json({status:"already added"})
    }
  },
  viewWishlist:async(req,res)=>{
    let user = req.session.user;
    let cartcount = null;
    if (req.session.user) {
      cartcount = await userhelper.getCartcount(req.session.user._id);
    }
    const categories = await listedCategories();
    const products = await userhelper.viewWishlist(user._id)
    res.render("user/validation", {
      products,
      cartcount,
      user,
      categories,
    })
  }
};
