const { data } = require("jquery");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const { Number } = require("twilio/lib/twiml/VoiceResponse");
var currentdate = new Date;
var date = currentdate.toLocaleDateString()

mongoose
  .connect("mongodb://0.0.0.0:27017/ecom", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB!");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

const userschema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },

  access: {
    type: Boolean,
    default: false,
  },
  CreatedAt: {
    type: Date,
    default: Date.now,
  },
  phone: {
    type: String,
    required: true,
    index: true,
  },
  blocked: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  adress:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'address'
  }]
});


const cartschema = new mongoose.Schema({
  userId: {
    type:mongoose.Schema.Types.ObjectId,
    ref:'user'
  },
  products:[{
    productId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'product',
    },
    quantity:{
      type:Number,
      required:true,
      default:1
    }
  }]
  
});



const productSchema = new mongoose.Schema({
  Productname: {
    type: String,
  },
  ProductDescription: {
    type: String,
  },
  Quantity: {
    type: Number,
  },
  Image: [],
  Firstprice: {
    type: Number,
    default:0
  },
  Brand: {
    type: String,
  },
  Color: {
    type: String,
  },
  Price: {
    type: Number,
  },
  Category: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  
});


const categorySchema = new mongoose.Schema({
  Categoryname: {
    type: String,
  },
  listed:{
    type: Boolean,
    default:true
  },
  offer:{
    type: Number,
    default:0
  },
  Description: {
    type: String,
  }
  })

  const orderschema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    orderDate:{
      type:Date,
    },
    products: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
      },
      quantity: {
        type: Number,
        required: true,
        default: 1
      }
    }],
    total: Number,
    status:{
      type:String,
      default:'placed'
    },
    paymentmethod:String,
    paymentstatus:{
      type:String,
      default:'pending'
    },
    Shippingadress:{
      name:String,
      street:String,
      city:String,
      contry:String,
      postalcode:String,
    }
  })

  const coupenSchema = new mongoose.Schema({
    coupencode: {
      type: String,
    },
    expirydate:{
      type:Date
    },
    discount:{
      type:Number
    },
    coupentitle:{
      type:String
    },
    userId: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
    })
  

  

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  street: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  phone:Number
});



const walletschema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  balance: {
    type: Number,
  }
});


module.exports = {
  user: mongoose.model("user", userschema),
  product: mongoose.model("product", productSchema),
  category:mongoose.model("category",categorySchema),
  cart: mongoose.model("cart", cartschema),
  order: mongoose.model("order", orderschema),
  address:mongoose.model('address', addressSchema),
  wallet:mongoose.model('wallet', walletschema ),
  coupen:mongoose.model('coupen', coupenSchema )
};
