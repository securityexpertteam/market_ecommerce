require('dotenv').config(); const mongoose=require('mongoose'); const bcrypt=require('bcryptjs'); const app=require('./app'); const User=require('./models/User'); const Product=require('./models/Product');
async function seed(){const email=process.env.SEED_SELLER_EMAIL;const password=process.env.SEED_SELLER_PASSWORD;if(!email||!password)return;const seller=await User.findOneAndUpdate({email},{name:process.env.SEED_SELLER_NAME,email,role:'seller',password:await bcrypt.hash(password,12)},{upsert:true,new:true});if(await Product.countDocuments())return;await Product.insertMany([{name:'Cloud Runner',description:'Featherlight runners made for every day.',category:'Sneakers',price:3499,stock:18,imageURL:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',seller:seller._id},{name:'Everyday Carry',description:'A clean, spacious essential bag.',category:'Accessories',price:1899,stock:12,imageURL:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',seller:seller._id},{name:'Studio Headphones',description:'Warm, precise sound with all-day comfort.',category:'Electronics',price:5999,stock:7,imageURL:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',seller:seller._id},{name:'Shiva Kasi crackers pack',description:'A festive family pack for bright Diwali celebrations and joyful evenings.',category:'Diwali Crackers',price:1499,stock:20,imageURL:'https://images.unsplash.com/photo-1533230408708-8f9f91d1235a?auto=format&fit=crop&w=900&q=80',seller:seller._id}]);}
const port = Number(process.env.PORT) || 4000;

if (!process.env.MONGODB_URI) {
	console.error('MONGODB_URI is required before starting the API.');
	process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
	.then(async () => {
		await seed();
		app.listen(port, () => console.log(`Hype API listening on port ${port}`));
	})
	.catch((error) => {
		console.error('MongoDB connection failed:', error.message);
		process.exit(1);
	});
