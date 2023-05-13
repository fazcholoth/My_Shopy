var adminhelper = require("../helpers/adminhelpers");
var cloudinary = require("../utils/cloudinary");
var cloudinary = require("cloudinary").v2;

let message = "";
let Error=null

module.exports = {
  adminlogin: async (req, res) => {
    let dashActice1='active'
   
    const results = await adminhelper.adminlogin(req.query.sort);
    
    if (req.query.sort){
      let data = results.data
      let period = results.period
      res.json({data,period})
    }else{
      res.render("admin/admin-dash", { results: results.data,totalrevenue:results.total,totalorders:results.orders ,totalproducts:results.products,dashActice1});
    }
    
  },
  showAddproduct: (req, res) => {
    let dashActice2='active'
    adminhelper.showAddproduct().then((cat) => {
      res.render("admin/add-product", { cat ,dashActice2});
    });
  },
  postAddproduct: async (req, res) => {
    console.log(req.body);
    const images = [];
    for (let i = 0; i < req.files.length; i++) {
      const { url } = await cloudinary.uploader.upload(req.files[i].path);
      images.push(url);
    }
    console.log(images);
    adminhelper.addProduct(req.body, images).then();
    res.redirect("/admin/add-product");
  },
  viewProducts: (req, res) => {
    let dashActice2='active'
    adminhelper.getViewProducts().then((response) => {
      res.render("admin/view-product", { response ,dashActice2});
    });
  },
  deleteProduct: (req, res) => {
    adminhelper.deleteProduct(req.params.id).then();
    res.redirect("/admin/view-product");
  },
  showAddcategory: (req, res) => {
    let dashActice5='active'
    adminhelper.showAddcategory().then((cat) => {
      res.render("admin/addcategory", { cat,Error,dashActice5});
    });
  },
  postAddcategory: (req, res) => {
    let dashActice5='active'
    adminhelper.postAddcategory(req.body).then((existing) => {
      if (existing) {
        let Error ="already existing"
        adminhelper.showAddcategory().then((cat) => {
          res.render("admin/addcategory", { cat ,Error,dashActice5});
        });
      } else {
        res.redirect("/admin/add-category");
      }
    });
  },
  showUsers: (req, res) => {
    let dashActice4='active'
    adminhelper.showUsers().then((users) => {
      res.render("admin/view-user", { users ,dashActice4});
    });
  },
  blockUser: (req, res) => {
    adminhelper.blockUser(req.params.id).then();
    res.redirect("/admin/view-users");
  },
  unblockUser: (req, res) => {
    adminhelper.unblockUser(req.params.id).then();
    res.redirect("/admin/view-users");
  },
  deleteCategory: (req, res) => {
    adminhelper.deleteCategory(req.params.id).then(() => {
      console.log(req.params.id);
      res.redirect("/admin/add-category");
    });
  },
  showeditProduct: (req, res) => {
    let dashActice2='active'
    adminhelper.showeditProduct(req.params.id).then((prodata) => {
      var productdata = prodata;
      adminhelper.showcatData().then((catdata) => {
        res.render("admin/edit-viewproduct", { productdata, catdata,dashActice2 });
      });
    });
  },
  posteditProduct: async (req, res) => {
    const images = [];
    for (let i = 0; i < req.files.length; i++) {
      const { url } = await cloudinary.uploader.upload(req.files[i].path);
      images.push(url);
    }
    var Id = req.params.id;
    var editedData = req.body;
    adminhelper.posteditProduct(Id, editedData, images).then(() => {
      res.redirect("/admin/view-product");
    });
  },
  showLogin: (req, res) => {
    res.render("admin/login");
  },
  postLogin: (req, res) => {
    adminhelper.postLogin(req.body).then((response) => {
      if (response.status) {
        req.session.adminloggedIn = true;
        req.session.admin = response.admin;
        res.redirect("/admin");
      } else {
        res.redirect("/admin/login");
      }
    });
  },
  logOut: (req, res) => {
    req.session.destroy();
    res.redirect("/admin/login");
  },
  publishProduct: (req, res) => {
    adminhelper.publishProduct(req.params.id).then();
    res.redirect("/admin/view-product");
  },
  viewOrders: async (req, res) => {
    let dashActice3='active'
    const Orders = await adminhelper.viewOrders()
    const orders = Orders.map((order) => {
      const options = {
        day: "numeric",
        month: "short",
        year: "numeric",
      };
      const updatedOrder = {
        ...order._doc,
        orderDate: order.orderDate.toLocaleDateString("en-US", options),
      };
      return updatedOrder;
    });
    res.render("admin/orders", { orders ,dashActice3});
  },
  cancelOrder: async (req, res) => {
    const orderId = req.body.orderId;
    await adminhelper.cancelOrder(orderId);
    res.json({ status: true });
  },
  shipOrder: async (req, res) => {
    const orderId = req.body.orderId;
    await adminhelper.shipOrder(orderId);
    res.json({ status: true });
  },
  deliverOrder: async (req, res) => {
    const orderId = req.body.orderId;
    await adminhelper.deliverOrder(orderId);
    res.json({ status: true });
  },
  approveReturn: async (req, res) => {
    const userId = req.body.userId;
    const total = req.body.amount;
    const orderId = req.body.orderId;
    await adminhelper.approveReturn(userId, total,orderId);
    res.json({ status: true });
  },
  viewCoupen: async (req, res) => {
    let dashActice6='active'
    coupen = await adminhelper.viewCoupen();
    res.render("admin/coupen", { coupen ,dashActice6});
  },
  addCoupen: async (req, res) => {
    await adminhelper.addcoupen(req.body);
    res.redirect("/admin/view-coupens");
  },
  orderDetails: async (req, res) => {
    let dashActice3='active'
    let orderId = req.params.orderId;
    const { order, product } = await adminhelper.orderDetails(orderId);
    console.log(product);
    res.render("admin/order-details", { order, product: product ,dashActice3});
  },
  viewSales: async (req, res) => {
    let dashActice7='active'
    if (req.query.from) {
      const Orders = await adminhelper.viewSales(req.query);
      const orders = Orders.map((order) => {
        const options = {
          day: "numeric",
          month: "short",
          year: "numeric",
        };
        const updatedOrder = {
          ...order._doc,
          orderDate: order.orderDate.toLocaleDateString("en-US", options),
        };
        return updatedOrder;
      });
      res.json(orders);
    } else {
      const Orders = await adminhelper.viewSales(req.query);
      const orders = Orders.map((order) => {
        const options = {
          day: "numeric",
          month: "short",
          year: "numeric",
        };
        const updatedOrder = {
          ...order._doc,
          orderDate: order.orderDate.toLocaleDateString("en-US", options),
        };
        return updatedOrder;
      });
      res.render("admin/sales", { orders ,dashActice7});
    }
  },
  viewEditcategory:async(req,res)=>{
    let dashActice5='active'
    const catId = req.params.catId
    const category = await adminhelper.showEditcategory(catId)
    res.render("admin/edit-category", { category ,dashActice5});
  },
  postEditcategory:async(req,res)=>{
    let dashActice5='active'
    const catId = req.params.catId
    await adminhelper.postEditcategory(catId,req.body)
    const cat = await adminhelper.showAddcategory()
      res.render("admin/addcategory", { cat ,Error,dashActice5});
  },
  listCategory:async(req,res)=>{
    let dashActice5='active'
    const catId = req.params.catId
    await adminhelper.listCategory(catId)
    const cat = await adminhelper.showAddcategory()
      res.render("admin/addcategory", { cat ,Error,dashActice5});
  },
  editCoupen:async(req,res)=>{
    let dashActice6='active'
    let coupenId = req.params.coupenId;
    let coupen = await adminhelper.editCoupen(coupenId)
    res.render("admin/edit-coupen",{coupen,dashActice6})
  },
  posteditCoupen:async(req,res)=>{
    let coupenId = req.params.coupenId;
    await adminhelper.posteditCoupen(req.body,coupenId)
    res.redirect("/admin/view-coupens");
  },
  deleteCoupen:async(req,res)=>{
    let coupenId = req.params.coupenId;
    await adminhelper.deleteCoupen(coupenId)
    res.redirect("/admin/view-coupens");
  }
};
