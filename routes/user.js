var express = require('express');
var router = express.Router();
var controller = require('../controllers/usercontroller')

const verifylogin=(req,res,next)=>{
        if(req.session.loggedIn){
            next()
        }else{
            res.redirect('/login')
        }
    }


router.get('/',controller.getHome)

router.route('/signup')
       .get(controller.showSignup)
       .post(controller.postSignup)

router.route('/login')
        .get(controller.showLogin)
        .post(controller.postLogin)
router.get('/logout',controller.userLogout)      
router.get("/product-detail/:id", controller.productDetails);
router.get('/addto-cart/:id',verifylogin,controller.addtoCart)
router.get('/get-cart',verifylogin,controller.getCart) 
router.post('/change-product-quantity',verifylogin,controller.changeQuantity)
router.post('/remove-item',verifylogin,controller.removeItem)
router.get('/category-view/:category',controller.categoryView) 
router.post('/check-Out',verifylogin,controller.placeOrder) 
router.get('/check-Out',verifylogin,controller.viewCheckout)       
router.get('/order-success',verifylogin,controller.orderSuccess)
router.get('/otp-login',controller.otpLogin)
router.post('/otp-Login',controller.postOtplogin)
router.get('/verify-otp',controller.VerifyOtp)
router.post('/verify-otp',controller.postverifyOtp)
router.get('/add-address',controller.addAddress)
router.post('/add-address',controller.postaddAddress)
router.get('/view-orders',verifylogin,controller.viewOrders)
router.get('/view-orderdetails/:orderId',verifylogin,controller.viewOrderdetails)
router.post('/verify-payment',verifylogin,controller.verifyPayment)
router.post('/cancel-order',verifylogin,controller.cancelOrder)
router.post('/return-order',verifylogin,controller.returnOrder)
router.post('/apply-coupen',verifylogin,controller.applyCoupen)
router.get('/view-coupons',verifylogin,controller.viewCoupen)
router.post('/search-products',controller.searchProducts)
router.get('/resend-otp',controller.resendOtp)
router.get('/create-invoice/:orderId',controller.invoiceDownload)
router.get('/edit-address/:addressId',controller.showeditAddress)
router.get('/delete-address/:addressId',controller.deleteAddress)
router.post('/edit-address/:addressId',controller.posteditAddress)
router.get('/view-profile',controller.viewProfile)
router.get('/view-allproducts',controller.viewallProducts)
router.get('/addto-wishlist/:id',verifylogin,controller.addtoWishlist)
router.get('/view-wishlist',verifylogin,controller.viewWishlist)
router.post('/changeprofile',verifylogin,controller.changeProfile)
module.exports = router;
