var admincontroller = require("../controllers/admincontroller");
var express = require("express");
var router = express.Router();
var upload = require("../utils/multer");
var cloudinary = require("../utils/cloudinary");

var verifylogin = (req, res, next) => {
  if (req.session.adminloggedIn) {
    next();
  } else {
    res.redirect("admin/login");
  }
};

/* GET users listing. */
router.get("/",verifylogin,admincontroller.adminlogin);
router.route("/add-product")
  .get( admincontroller.showAddproduct)
  .post(upload.array("Image", 4), admincontroller.postAddproduct);
router.route("/view-product").get(admincontroller.viewProducts);

router.get("/delete-product/:id", verifylogin, admincontroller.deleteProduct);

router.route("/add-category")
  .get( admincontroller.showAddcategory)
  .post(admincontroller.postAddcategory);
router.get("/view-users", verifylogin, admincontroller.showUsers);
router.get("/block-users/:id",verifylogin, admincontroller.blockUser);
router.get("/unblock-users/:id", admincontroller.unblockUser);
router.get("/delete_category/:id", admincontroller.deleteCategory);
router.get("/edit-product/:id",verifylogin,admincontroller.showeditProduct);
router.post("/edit-product/:id",upload.array("Image2", 4),admincontroller.posteditProduct);
router.get("/login",admincontroller.showLogin);
router.post("/login", admincontroller.postLogin);
router.get("/logout", admincontroller.logOut);
router.get('/delete-product/:id',admincontroller.deleteProduct)
router.get('/publish-product/:id',verifylogin,admincontroller.publishProduct)
router.get('/view-orders',verifylogin,admincontroller.viewOrders)
router.post('/cancel-order',verifylogin,admincontroller.cancelOrder)
router.post('/ship-order',verifylogin,admincontroller.shipOrder)
router.post('/deliver-order',verifylogin,admincontroller.deliverOrder)
router.post('/approve-return',verifylogin,admincontroller.approveReturn)
router.get('/view-coupens',verifylogin,admincontroller.viewCoupen)
router.post('/add-coupon',verifylogin,admincontroller.addCoupen)
router.get('/order-details/:orderId',verifylogin,admincontroller.orderDetails)
router.get('/view-sales/',verifylogin,admincontroller.viewSales)
router.get('/edit_category/:catId',verifylogin,admincontroller.viewEditcategory)
router.post('/edit-category/:catId',verifylogin,admincontroller.postEditcategory)
router.get('/list-category/:catId',verifylogin,admincontroller.listCategory)
router.get('/edit-coupen/:coupenId',verifylogin,admincontroller.editCoupen)
router.post('/edit-coupen/:coupenId',verifylogin,admincontroller.posteditCoupen)
router.get('/delete-coupen/:coupenId',verifylogin,admincontroller.deleteCoupen)
module.exports = router;
