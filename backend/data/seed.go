package data

import (
	"math"
	"math/rand"
	"trendspy/backend/models"
)

// months used for all time-series data
var months = []string{"Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"}

// Products is the full in-memory product catalog — 50 diverse products
var Products = []models.Product{
	// Electronics
	{ASIN: "B09X7CRKRZ", Name: "SoundMax Pro Wireless Noise Cancelling Headphones", Image: "🎧", Category: "Electronics", SubCategory: "Headphones", Brand: "SoundMax", Price: 89.99, BSR: 142, BSRCategory: "Electronics > Headphones", MonthlySales: 4820, MonthlyRevenue: 433920, Reviews: 12480, Rating: 4.5, SellerCount: 3, Trend: "rising", TrendPct: 23, LaunchDate: "2022-09", ProductScore: 87, Tags: []string{"audio", "wireless", "noise-cancelling"}},
	{ASIN: "B0BJLF2BRM", Name: "ViewPro Portable Mini Projector 4K HD", Image: "📽️", Category: "Electronics", SubCategory: "Projectors", Brand: "ViewPro", Price: 149.99, BSR: 389, BSRCategory: "Electronics > Projectors", MonthlySales: 2940, MonthlyRevenue: 440970, Reviews: 7230, Rating: 4.3, SellerCount: 6, Trend: "rising", TrendPct: 41, LaunchDate: "2022-11", ProductScore: 79, Tags: []string{"projector", "4k", "portable"}},
	{ASIN: "B0C9WNXRV3", Name: "LumiDesk LED Desk Lamp with Wireless Charging", Image: "💡", Category: "Electronics", SubCategory: "Desk Lamps", Brand: "LumiDesk", Price: 44.99, BSR: 321, BSRCategory: "Electronics > Lighting", MonthlySales: 5200, MonthlyRevenue: 233948, Reviews: 4320, Rating: 4.4, SellerCount: 8, Trend: "declining", TrendPct: -12, LaunchDate: "2023-01", ProductScore: 68, Tags: []string{"desk-lamp", "wireless-charging", "led"}},
	{ASIN: "B0BKZQM2NP", Name: "UltraView 4K Webcam 60fps with Ring Light", Image: "📷", Category: "Electronics", SubCategory: "Webcams", Brand: "UltraView", Price: 79.99, BSR: 234, BSRCategory: "Electronics > Webcams", MonthlySales: 3800, MonthlyRevenue: 303962, Reviews: 5490, Rating: 4.6, SellerCount: 4, Trend: "rising", TrendPct: 34, LaunchDate: "2023-03", ProductScore: 84, Tags: []string{"webcam", "4k", "streaming"}},
	{ASIN: "B0C1TXRPYK", Name: "PowerBank Pro 26800mAh Ultra Fast Charging", Image: "🔋", Category: "Electronics", SubCategory: "Power Banks", Brand: "ChargePro", Price: 39.99, BSR: 178, BSRCategory: "Electronics > Power Banks", MonthlySales: 7200, MonthlyRevenue: 287928, Reviews: 18700, Rating: 4.7, SellerCount: 5, Trend: "stable", TrendPct: 3, LaunchDate: "2022-05", ProductScore: 88, Tags: []string{"powerbank", "fast-charging", "usbc"}},
	{ASIN: "B09MQ4PNPX", Name: "SmartTrack GPS Tracker Tile Compatible", Image: "📡", Category: "Electronics", SubCategory: "Trackers", Brand: "SmartTrack", Price: 29.99, BSR: 287, BSRCategory: "Electronics > GPS", MonthlySales: 6100, MonthlyRevenue: 182939, Reviews: 9800, Rating: 4.3, SellerCount: 9, Trend: "rising", TrendPct: 28, LaunchDate: "2022-08", ProductScore: 75, Tags: []string{"gps", "tracker", "bluetooth"}},
	{ASIN: "B0BTVQ2HQK", Name: "NightVision Security Camera Outdoor 4K", Image: "🎥", Category: "Electronics", SubCategory: "Security Cameras", Brand: "SafeGuard", Price: 64.99, BSR: 412, BSRCategory: "Electronics > Cameras", MonthlySales: 2650, MonthlyRevenue: 172237, Reviews: 4100, Rating: 4.2, SellerCount: 11, Trend: "stable", TrendPct: 5, LaunchDate: "2023-02", ProductScore: 71, Tags: []string{"security", "camera", "outdoor", "4k"}},
	{ASIN: "B0BZQX7KLM", Name: "MechKey Pro RGB Mechanical Keyboard Compact", Image: "⌨️", Category: "Electronics", SubCategory: "Keyboards", Brand: "MechKey", Price: 59.99, BSR: 195, BSRCategory: "Electronics > Keyboards", MonthlySales: 5400, MonthlyRevenue: 323946, Reviews: 8200, Rating: 4.5, SellerCount: 7, Trend: "rising", TrendPct: 19, LaunchDate: "2022-12", ProductScore: 82, Tags: []string{"keyboard", "mechanical", "gaming", "rgb"}},
	{ASIN: "B09ZQKPLMN", Name: "SilentClick Wireless Mouse Ergonomic 2.4G", Image: "🖱️", Category: "Electronics", SubCategory: "Mice", Brand: "SilentClick", Price: 24.99, BSR: 156, BSRCategory: "Electronics > Mice", MonthlySales: 9100, MonthlyRevenue: 227419, Reviews: 14600, Rating: 4.6, SellerCount: 6, Trend: "stable", TrendPct: 7, LaunchDate: "2022-04", ProductScore: 86, Tags: []string{"mouse", "wireless", "ergonomic"}},
	{ASIN: "B0C6ZKPMQR", Name: "DualDock Charging Station for 5 Devices", Image: "🔌", Category: "Electronics", SubCategory: "Charging Stations", Brand: "DualDock", Price: 34.99, BSR: 267, BSRCategory: "Electronics > Chargers", MonthlySales: 6800, MonthlyRevenue: 237932, Reviews: 7340, Rating: 4.5, SellerCount: 5, Trend: "rising", TrendPct: 22, LaunchDate: "2023-01", ProductScore: 83, Tags: []string{"charging", "usbc", "multi-device"}},

	// Home & Kitchen
	{ASIN: "B0C1FR57NJ", Name: "NaturCasa Bamboo Bathroom Organizer Set 5-Piece", Image: "🪣", Category: "Home & Kitchen", SubCategory: "Bathroom", Brand: "NaturCasa", Price: 34.99, BSR: 207, BSRCategory: "Home & Kitchen > Bathroom", MonthlySales: 6100, MonthlyRevenue: 213490, Reviews: 3450, Rating: 4.7, SellerCount: 12, Trend: "stable", TrendPct: 4, LaunchDate: "2023-02", ProductScore: 82, Tags: []string{"bamboo", "bathroom", "organizer"}},
	{ASIN: "B0BRHMC5JS", Name: "AirFresh HEPA Air Purifier for Large Rooms", Image: "💨", Category: "Home & Kitchen", SubCategory: "Air Purifiers", Brand: "AirFresh", Price: 119.99, BSR: 312, BSRCategory: "Home & Kitchen > Air Purifiers", MonthlySales: 2800, MonthlyRevenue: 335972, Reviews: 5600, Rating: 4.6, SellerCount: 4, Trend: "rising", TrendPct: 37, LaunchDate: "2023-01", ProductScore: 88, Tags: []string{"air-purifier", "hepa", "allergies"}},
	{ASIN: "B09QKLMP7X", Name: "CookMaster Non-Stick Cookware Set 12-Piece", Image: "🍳", Category: "Home & Kitchen", SubCategory: "Cookware", Brand: "CookMaster", Price: 89.99, BSR: 198, BSRCategory: "Home & Kitchen > Cookware", MonthlySales: 3400, MonthlyRevenue: 305966, Reviews: 6700, Rating: 4.5, SellerCount: 6, Trend: "stable", TrendPct: 6, LaunchDate: "2022-10", ProductScore: 80, Tags: []string{"cookware", "non-stick", "kitchen"}},
	{ASIN: "B0BXMKQPLN", Name: "FrozenBrew Cold Brew Coffee Maker 1 Gallon", Image: "☕", Category: "Home & Kitchen", SubCategory: "Coffee", Brand: "FrozenBrew", Price: 27.99, BSR: 231, BSRCategory: "Home & Kitchen > Coffee", MonthlySales: 5700, MonthlyRevenue: 159543, Reviews: 9200, Rating: 4.8, SellerCount: 3, Trend: "rising", TrendPct: 42, LaunchDate: "2022-07", ProductScore: 91, Tags: []string{"coffee", "cold-brew", "kitchen"}},
	{ASIN: "B0C3YQNKLM", Name: "SlimLine Robot Vacuum Cleaner with Mapping", Image: "🤖", Category: "Home & Kitchen", SubCategory: "Vacuums", Brand: "SlimLine", Price: 249.99, BSR: 287, BSRCategory: "Home & Kitchen > Vacuums", MonthlySales: 1950, MonthlyRevenue: 487481, Reviews: 3800, Rating: 4.4, SellerCount: 5, Trend: "rising", TrendPct: 31, LaunchDate: "2023-03", ProductScore: 85, Tags: []string{"robot-vacuum", "smart-home", "cleaning"}},
	{ASIN: "B0BZKPQMXN", Name: "SmartBlend Pro Countertop Blender 1800W", Image: "🥤", Category: "Home & Kitchen", SubCategory: "Blenders", Brand: "SmartBlend", Price: 79.99, BSR: 341, BSRCategory: "Home & Kitchen > Blenders", MonthlySales: 3100, MonthlyRevenue: 247969, Reviews: 4900, Rating: 4.5, SellerCount: 7, Trend: "stable", TrendPct: 9, LaunchDate: "2023-01", ProductScore: 77, Tags: []string{"blender", "kitchen", "smoothie"}},
	{ASIN: "B09KQXMLPN", Name: "VacuSeal Food Storage Bags Reusable 50-Pack", Image: "🛍️", Category: "Home & Kitchen", SubCategory: "Food Storage", Brand: "VacuSeal", Price: 19.99, BSR: 123, BSRCategory: "Home & Kitchen > Food Storage", MonthlySales: 11200, MonthlyRevenue: 223888, Reviews: 24600, Rating: 4.7, SellerCount: 8, Trend: "stable", TrendPct: 5, LaunchDate: "2022-03", ProductScore: 89, Tags: []string{"food-storage", "reusable", "eco-friendly"}},
	{ASIN: "B0C8WZQKPN", Name: "EcoWipe Reusable Paper Towel Set 12-Pack", Image: "🧻", Category: "Home & Kitchen", SubCategory: "Paper Goods", Brand: "EcoWipe", Price: 14.99, BSR: 167, BSRCategory: "Home & Kitchen > Paper Goods", MonthlySales: 8900, MonthlyRevenue: 133411, Reviews: 16400, Rating: 4.6, SellerCount: 10, Trend: "rising", TrendPct: 55, LaunchDate: "2023-02", ProductScore: 87, Tags: []string{"eco-friendly", "reusable", "paper-towel"}},

	// Sports & Outdoors
	{ASIN: "B0BZ4WXQKF", Name: "FitForce Adjustable Dumbbell Set 55lb", Image: "🏋️", Category: "Sports & Outdoors", SubCategory: "Strength Training", Brand: "FitForce", Price: 219.99, BSR: 98, BSRCategory: "Sports > Strength Equipment", MonthlySales: 3800, MonthlyRevenue: 835962, Reviews: 9870, Rating: 4.6, SellerCount: 2, Trend: "rising", TrendPct: 18, LaunchDate: "2022-06", ProductScore: 91, Tags: []string{"dumbbells", "fitness", "home-gym"}},
	{ASIN: "B0BVXQKTFW", Name: "HydroFlow Insulated Stainless Steel Water Bottle 40oz", Image: "🍶", Category: "Sports & Outdoors", SubCategory: "Water Bottles", Brand: "HydroFlow", Price: 29.99, BSR: 56, BSRCategory: "Sports > Water Bottles", MonthlySales: 8900, MonthlyRevenue: 266911, Reviews: 22100, Rating: 4.8, SellerCount: 4, Trend: "rising", TrendPct: 31, LaunchDate: "2022-03", ProductScore: 94, Tags: []string{"water-bottle", "insulated", "outdoor"}},
	{ASIN: "B0C2QZXMKP", Name: "TrailBlazer Hiking Backpack 45L Waterproof", Image: "🎒", Category: "Sports & Outdoors", SubCategory: "Backpacks", Brand: "TrailBlazer", Price: 79.99, BSR: 187, BSRCategory: "Sports > Backpacks", MonthlySales: 3600, MonthlyRevenue: 287964, Reviews: 5900, Rating: 4.6, SellerCount: 5, Trend: "rising", TrendPct: 26, LaunchDate: "2023-01", ProductScore: 85, Tags: []string{"hiking", "backpack", "outdoor", "waterproof"}},
	{ASIN: "B09XQKLNMP", Name: "FlexMat Yoga Mat Non-Slip Extra Thick 6mm", Image: "🧘", Category: "Sports & Outdoors", SubCategory: "Yoga", Brand: "FlexMat", Price: 34.99, BSR: 145, BSRCategory: "Sports > Yoga", MonthlySales: 6800, MonthlyRevenue: 237932, Reviews: 13200, Rating: 4.7, SellerCount: 9, Trend: "stable", TrendPct: 8, LaunchDate: "2022-04", ProductScore: 83, Tags: []string{"yoga", "fitness", "mat"}},
	{ASIN: "B0BWKQZMPL", Name: "SpeedRope Pro Jump Rope with Ball Bearings", Image: "🪢", Category: "Sports & Outdoors", SubCategory: "Cardio", Brand: "SpeedRope", Price: 24.99, BSR: 213, BSRCategory: "Sports > Cardio", MonthlySales: 7400, MonthlyRevenue: 184926, Reviews: 11700, Rating: 4.5, SellerCount: 7, Trend: "stable", TrendPct: 4, LaunchDate: "2022-09", ProductScore: 80, Tags: []string{"jump-rope", "cardio", "fitness"}},
	{ASIN: "B0C5NQXMKL", Name: "ResistBand Pro Resistance Band Set 5-Level", Image: "💪", Category: "Sports & Outdoors", SubCategory: "Resistance Bands", Brand: "ResistBand", Price: 19.99, BSR: 134, BSRCategory: "Sports > Fitness Accessories", MonthlySales: 9200, MonthlyRevenue: 183808, Reviews: 18900, Rating: 4.6, SellerCount: 11, Trend: "rising", TrendPct: 15, LaunchDate: "2022-05", ProductScore: 84, Tags: []string{"resistance-bands", "home-gym", "fitness"}},
	{ASIN: "B0BQZXMNPK", Name: "CoolDry Performance Athletic Socks 6-Pack", Image: "🧦", Category: "Sports & Outdoors", SubCategory: "Socks", Brand: "CoolDry", Price: 17.99, BSR: 89, BSRCategory: "Sports > Apparel", MonthlySales: 12400, MonthlyRevenue: 222876, Reviews: 28700, Rating: 4.7, SellerCount: 6, Trend: "stable", TrendPct: 6, LaunchDate: "2022-02", ProductScore: 88, Tags: []string{"socks", "athletic", "performance"}},

	// Pet Supplies
	{ASIN: "B0C3XQPWMN", Name: "PawClean Pet Grooming Vacuum Kit 5-in-1", Image: "🐕", Category: "Pet Supplies", SubCategory: "Grooming", Brand: "PawClean", Price: 59.99, BSR: 174, BSRCategory: "Pet Supplies > Grooming", MonthlySales: 3650, MonthlyRevenue: 218964, Reviews: 5780, Rating: 4.5, SellerCount: 5, Trend: "rising", TrendPct: 57, LaunchDate: "2023-04", ProductScore: 85, Tags: []string{"pet", "grooming", "vacuum", "dog"}},
	{ASIN: "B09ZMQKPLN", Name: "FurSoft Dog Bed Orthopedic Memory Foam Large", Image: "🐶", Category: "Pet Supplies", SubCategory: "Beds", Brand: "FurSoft", Price: 49.99, BSR: 212, BSRCategory: "Pet Supplies > Beds", MonthlySales: 4100, MonthlyRevenue: 204959, Reviews: 8900, Rating: 4.7, SellerCount: 6, Trend: "rising", TrendPct: 22, LaunchDate: "2022-11", ProductScore: 83, Tags: []string{"dog-bed", "orthopedic", "pet"}},
	{ASIN: "B0BYKXQPNM", Name: "SlowFeed Interactive Dog Puzzle Feeder Bowl", Image: "🐾", Category: "Pet Supplies", SubCategory: "Feeders", Brand: "ThinkPaw", Price: 22.99, BSR: 287, BSRCategory: "Pet Supplies > Feeders", MonthlySales: 5600, MonthlyRevenue: 128744, Reviews: 7300, Rating: 4.6, SellerCount: 9, Trend: "rising", TrendPct: 38, LaunchDate: "2023-01", ProductScore: 82, Tags: []string{"dog-feeder", "puzzle", "slow-feed", "pet"}},
	{ASIN: "B0C7XZQMNK", Name: "CatTree Pro Tall Cat Tower with Scratching Post", Image: "🐱", Category: "Pet Supplies", SubCategory: "Cat Trees", Brand: "CatTree Pro", Price: 69.99, BSR: 198, BSRCategory: "Pet Supplies > Cat Furniture", MonthlySales: 3200, MonthlyRevenue: 223968, Reviews: 5400, Rating: 4.5, SellerCount: 7, Trend: "stable", TrendPct: 7, LaunchDate: "2022-10", ProductScore: 79, Tags: []string{"cat", "cat-tree", "scratching", "pet"}},
	{ASIN: "B09PZNKQXM", Name: "ShedStop Dog Brush Deshedding Tool Short Long Hair", Image: "🪮", Category: "Pet Supplies", SubCategory: "Grooming", Brand: "ShedStop", Price: 18.99, BSR: 143, BSRCategory: "Pet Supplies > Grooming", MonthlySales: 8700, MonthlyRevenue: 165213, Reviews: 22400, Rating: 4.8, SellerCount: 8, Trend: "rising", TrendPct: 14, LaunchDate: "2022-06", ProductScore: 87, Tags: []string{"dog-brush", "grooming", "deshedding", "pet"}},

	// Beauty & Personal Care
	{ASIN: "B0BZQNXPKM", Name: "GlowSkin Vitamin C Face Serum 30ml Anti-Aging", Image: "✨", Category: "Beauty", SubCategory: "Serums", Brand: "GlowSkin", Price: 24.99, BSR: 178, BSRCategory: "Beauty > Serums", MonthlySales: 7600, MonthlyRevenue: 189924, Reviews: 14200, Rating: 4.5, SellerCount: 10, Trend: "rising", TrendPct: 44, LaunchDate: "2022-12", ProductScore: 84, Tags: []string{"vitamin-c", "serum", "skincare", "anti-aging"}},
	{ASIN: "B0C4ZKPQNX", Name: "HairLux Ionic Hair Dryer 1875W Salon Grade", Image: "💆", Category: "Beauty", SubCategory: "Hair Tools", Brand: "HairLux", Price: 54.99, BSR: 234, BSRCategory: "Beauty > Hair Dryers", MonthlySales: 4300, MonthlyRevenue: 236457, Reviews: 8700, Rating: 4.4, SellerCount: 6, Trend: "rising", TrendPct: 27, LaunchDate: "2023-02", ProductScore: 81, Tags: []string{"hair-dryer", "ionic", "salon"}},
	{ASIN: "B09XZQMKPN", Name: "PureClenz Water Flosser Cordless Rechargeable", Image: "🦷", Category: "Beauty", SubCategory: "Oral Care", Brand: "PureClenz", Price: 39.99, BSR: 267, BSRCategory: "Beauty > Oral Care", MonthlySales: 5200, MonthlyRevenue: 207948, Reviews: 9100, Rating: 4.6, SellerCount: 5, Trend: "rising", TrendPct: 36, LaunchDate: "2022-09", ProductScore: 86, Tags: []string{"water-flosser", "oral-care", "dental"}},
	{ASIN: "B0C2PXNKQM", Name: "DermaRoller Titanium Microneedling 0.25mm 540 Needles", Image: "🧴", Category: "Beauty", SubCategory: "Skincare Tools", Brand: "DermaRoller", Price: 14.99, BSR: 312, BSRCategory: "Beauty > Skincare", MonthlySales: 6700, MonthlyRevenue: 100383, Reviews: 11200, Rating: 4.3, SellerCount: 14, Trend: "declining", TrendPct: -9, LaunchDate: "2022-07", ProductScore: 66, Tags: []string{"dermaroller", "skincare", "microneedling"}},
	{ASIN: "B0BWZXQMPL", Name: "LashBoost Magnetic Eyelashes Natural Look 3 Pairs", Image: "👁️", Category: "Beauty", SubCategory: "Eye Makeup", Brand: "LashBoost", Price: 16.99, BSR: 189, BSRCategory: "Beauty > Eye Makeup", MonthlySales: 8900, MonthlyRevenue: 151211, Reviews: 16800, Rating: 4.5, SellerCount: 12, Trend: "rising", TrendPct: 48, LaunchDate: "2022-10", ProductScore: 80, Tags: []string{"eyelashes", "magnetic", "makeup"}},

	// Baby
	{ASIN: "B0C1KZQPNM", Name: "SleepWell Baby White Noise Machine 30 Sounds", Image: "👶", Category: "Baby", SubCategory: "Baby Care", Brand: "SleepWell", Price: 32.99, BSR: 156, BSRCategory: "Baby > Equipment", MonthlySales: 6400, MonthlyRevenue: 211136, Reviews: 12300, Rating: 4.8, SellerCount: 4, Trend: "rising", TrendPct: 29, LaunchDate: "2022-08", ProductScore: 92, Tags: []string{"baby", "white-noise", "sleep", "newborn"}},
	{ASIN: "B09QZNKPXM", Name: "TinyChef Silicone Baby Food Pouches Reusable 6-Pack", Image: "🍼", Category: "Baby", SubCategory: "Feeding", Brand: "TinyChef", Price: 19.99, BSR: 198, BSRCategory: "Baby > Feeding", MonthlySales: 7100, MonthlyRevenue: 141929, Reviews: 9800, Rating: 4.7, SellerCount: 6, Trend: "rising", TrendPct: 33, LaunchDate: "2022-11", ProductScore: 89, Tags: []string{"baby", "food-pouches", "silicone", "feeding"}},

	// Office Products
	{ASIN: "B0BZNPKQMX", Name: "ErgoLift Adjustable Laptop Stand Foldable Aluminum", Image: "💻", Category: "Office Products", SubCategory: "Laptop Stands", Brand: "ErgoLift", Price: 29.99, BSR: 167, BSRCategory: "Office > Laptop Accessories", MonthlySales: 7800, MonthlyRevenue: 233844, Reviews: 14100, Rating: 4.7, SellerCount: 7, Trend: "rising", TrendPct: 21, LaunchDate: "2022-06", ProductScore: 87, Tags: []string{"laptop-stand", "ergonomic", "office"}},
	{ASIN: "B0C5QXNKPM", Name: "WristEase Ergonomic Mouse Pad with Wrist Rest Gel", Image: "🖥️", Category: "Office Products", SubCategory: "Mouse Pads", Brand: "WristEase", Price: 14.99, BSR: 134, BSRCategory: "Office > Desk Accessories", MonthlySales: 10200, MonthlyRevenue: 152898, Reviews: 21700, Rating: 4.6, SellerCount: 9, Trend: "stable", TrendPct: 5, LaunchDate: "2022-04", ProductScore: 85, Tags: []string{"mouse-pad", "ergonomic", "wrist-rest", "office"}},
	{ASIN: "B09NKZQPLM", Name: "ClipNote Mini Projector Wireless Presentation Clicker", Image: "🖊️", Category: "Office Products", SubCategory: "Presentation", Brand: "ClipNote", Price: 34.99, BSR: 298, BSRCategory: "Office > Presentation", MonthlySales: 3800, MonthlyRevenue: 132962, Reviews: 6200, Rating: 4.4, SellerCount: 5, Trend: "stable", TrendPct: 6, LaunchDate: "2022-11", ProductScore: 76, Tags: []string{"presentation", "clicker", "office", "wireless"}},
	{ASIN: "B0BWQXZKPN", Name: "DeskCable Cable Management Box Organizer Large", Image: "📦", Category: "Office Products", SubCategory: "Cable Management", Brand: "DeskCable", Price: 22.99, BSR: 215, BSRCategory: "Office > Cable Management", MonthlySales: 6300, MonthlyRevenue: 144837, Reviews: 9700, Rating: 4.7, SellerCount: 6, Trend: "rising", TrendPct: 17, LaunchDate: "2022-09", ProductScore: 82, Tags: []string{"cable-management", "desk", "organizer", "office"}},

	// Clothing
	{ASIN: "B0C3ZPXNKQ", Name: "FlexWear Men's Moisture-Wicking Performance T-Shirt", Image: "👕", Category: "Clothing", SubCategory: "Men's Shirts", Brand: "FlexWear", Price: 22.99, BSR: 245, BSRCategory: "Clothing > Men's", MonthlySales: 5100, MonthlyRevenue: 117249, Reviews: 8400, Rating: 4.5, SellerCount: 8, Trend: "stable", TrendPct: 6, LaunchDate: "2022-07", ProductScore: 75, Tags: []string{"mens", "athletic", "moisture-wicking", "shirt"}},
	{ASIN: "B09PXNQKZM", Name: "ComfortFlex Women's High Waist Yoga Leggings", Image: "👗", Category: "Clothing", SubCategory: "Women's Activewear", Brand: "ComfortFlex", Price: 27.99, BSR: 198, BSRCategory: "Clothing > Women's Activewear", MonthlySales: 6700, MonthlyRevenue: 187533, Reviews: 13200, Rating: 4.6, SellerCount: 11, Trend: "rising", TrendPct: 24, LaunchDate: "2022-08", ProductScore: 79, Tags: []string{"yoga", "leggings", "women", "activewear"}},
	{ASIN: "B0BZXQPNKM", Name: "UltraLight Down Puffer Jacket Men's Packable", Image: "🧥", Category: "Clothing", SubCategory: "Jackets", Brand: "UltraLight", Price: 69.99, BSR: 312, BSRCategory: "Clothing > Men's Outerwear", MonthlySales: 2900, MonthlyRevenue: 202971, Reviews: 4800, Rating: 4.5, SellerCount: 7, Trend: "declining", TrendPct: -15, LaunchDate: "2022-11", ProductScore: 70, Tags: []string{"jacket", "puffer", "mens", "packable"}},

	// Toys
	{ASIN: "B0C1XZNPKQ", Name: "BuildBot STEM Robot Kit for Kids 8-12 Programmable", Image: "🤖", Category: "Toys & Games", SubCategory: "STEM", Brand: "BuildBot", Price: 49.99, BSR: 178, BSRCategory: "Toys > STEM", MonthlySales: 4800, MonthlyRevenue: 239952, Reviews: 7600, Rating: 4.7, SellerCount: 3, Trend: "rising", TrendPct: 52, LaunchDate: "2023-01", ProductScore: 90, Tags: []string{"stem", "robot", "kids", "programming"}},
	{ASIN: "B09KZQXPNM", Name: "MiniCraft Creative Building Blocks 1000 Pieces", Image: "🧱", Category: "Toys & Games", SubCategory: "Building Sets", Brand: "MiniCraft", Price: 34.99, BSR: 134, BSRCategory: "Toys > Building Sets", MonthlySales: 7200, MonthlyRevenue: 251928, Reviews: 15300, Rating: 4.8, SellerCount: 5, Trend: "stable", TrendPct: 8, LaunchDate: "2022-05", ProductScore: 88, Tags: []string{"building-blocks", "kids", "creative", "lego-alternative"}},
	{ASIN: "B0BWXPQNKZ", Name: "SpinPop Sensory Fidget Spinner Ring Pack 10", Image: "🌀", Category: "Toys & Games", SubCategory: "Fidget Toys", Brand: "SpinPop", Price: 12.99, BSR: 178, BSRCategory: "Toys > Fidget Toys", MonthlySales: 10400, MonthlyRevenue: 134996, Reviews: 19800, Rating: 4.4, SellerCount: 16, Trend: "declining", TrendPct: -8, LaunchDate: "2022-08", ProductScore: 68, Tags: []string{"fidget", "sensory", "anxiety", "kids"}},

	// Books / Journals
	{ASIN: "B0C2NKQZXP", Name: "DailyFlow Gratitude Journal 90-Day Planner Hardcover", Image: "📓", Category: "Books", SubCategory: "Journals", Brand: "DailyFlow", Price: 17.99, BSR: 134, BSRCategory: "Books > Journals", MonthlySales: 8700, MonthlyRevenue: 156513, Reviews: 16200, Rating: 4.8, SellerCount: 4, Trend: "rising", TrendPct: 38, LaunchDate: "2022-09", ProductScore: 91, Tags: []string{"journal", "gratitude", "planner", "mindfulness"}},
	{ASIN: "B0BPNZXQKM", Name: "SketchPad Pro Artist Drawing Book 200gsm 100 Sheets", Image: "🎨", Category: "Books", SubCategory: "Art Supplies", Brand: "SketchPad", Price: 14.99, BSR: 167, BSRCategory: "Books > Art", MonthlySales: 6900, MonthlyRevenue: 103431, Reviews: 11400, Rating: 4.7, SellerCount: 7, Trend: "stable", TrendPct: 7, LaunchDate: "2022-06", ProductScore: 83, Tags: []string{"sketchpad", "art", "drawing", "artist"}},
}

// Keywords is the master keyword dataset
var Keywords = []models.Keyword{
	{Keyword: "wireless headphones noise cancelling", SearchVolume: 184000, Trend: 22, CPC: 1.42, Competition: "High", Difficulty: 78, TopASIN: "B09X7CRKRZ", RelatedASINs: []string{"B09X7CRKRZ", "B0BZQX7KLM"}},
	{Keyword: "mini projector 4k", SearchVolume: 72000, Trend: 45, CPC: 0.98, Competition: "Medium", Difficulty: 56, TopASIN: "B0BJLF2BRM", RelatedASINs: []string{"B0BJLF2BRM"}},
	{Keyword: "portable projector for bedroom", SearchVolume: 38000, Trend: 67, CPC: 0.74, Competition: "Medium", Difficulty: 48, TopASIN: "B0BJLF2BRM", RelatedASINs: []string{"B0BJLF2BRM"}},
	{Keyword: "bamboo bathroom organizer", SearchVolume: 28500, Trend: 8, CPC: 0.55, Competition: "Low", Difficulty: 31, TopASIN: "B0C1FR57NJ", RelatedASINs: []string{"B0C1FR57NJ"}},
	{Keyword: "adjustable dumbbells set", SearchVolume: 110000, Trend: 19, CPC: 1.87, Competition: "High", Difficulty: 72, TopASIN: "B0BZ4WXQKF", RelatedASINs: []string{"B0BZ4WXQKF", "B0C5NQXMKL"}},
	{Keyword: "desk lamp wireless charging", SearchVolume: 54000, Trend: -8, CPC: 0.88, Competition: "Medium", Difficulty: 61, TopASIN: "B0C9WNXRV3", RelatedASINs: []string{"B0C9WNXRV3"}},
	{Keyword: "insulated water bottle 40oz", SearchVolume: 210000, Trend: 33, CPC: 0.65, Competition: "High", Difficulty: 82, TopASIN: "B0BVXQKTFW", RelatedASINs: []string{"B0BVXQKTFW"}},
	{Keyword: "pet hair vacuum grooming kit", SearchVolume: 89000, Trend: 61, CPC: 1.12, Competition: "Medium", Difficulty: 54, TopASIN: "B0C3XQPWMN", RelatedASINs: []string{"B0C3XQPWMN", "B09PZNKQXM"}},
	{Keyword: "dog grooming vacuum attachment", SearchVolume: 42000, Trend: 73, CPC: 0.93, Competition: "Low", Difficulty: 42, TopASIN: "B0C3XQPWMN", RelatedASINs: []string{"B0C3XQPWMN"}},
	{Keyword: "hydroflask alternative water bottle", SearchVolume: 67000, Trend: 28, CPC: 0.71, Competition: "Medium", Difficulty: 59, TopASIN: "B0BVXQKTFW", RelatedASINs: []string{"B0BVXQKTFW"}},
	{Keyword: "vitamin c serum face anti aging", SearchVolume: 156000, Trend: 44, CPC: 1.23, Competition: "High", Difficulty: 76, TopASIN: "B0BZQNXPKM", RelatedASINs: []string{"B0BZQNXPKM", "B0C2PXNKQM"}},
	{Keyword: "robot vacuum cleaner with mapping", SearchVolume: 93000, Trend: 31, CPC: 1.56, Competition: "High", Difficulty: 79, TopASIN: "B0C3YQNKLM", RelatedASINs: []string{"B0C3YQNKLM"}},
	{Keyword: "cold brew coffee maker 1 gallon", SearchVolume: 48000, Trend: 42, CPC: 0.67, Competition: "Low", Difficulty: 38, TopASIN: "B0BXMKQPLN", RelatedASINs: []string{"B0BXMKQPLN"}},
	{Keyword: "air purifier hepa large room", SearchVolume: 127000, Trend: 37, CPC: 1.34, Competition: "High", Difficulty: 74, TopASIN: "B0BRHMC5JS", RelatedASINs: []string{"B0BRHMC5JS"}},
	{Keyword: "yoga mat non slip thick", SearchVolume: 87000, Trend: 8, CPC: 0.58, Competition: "High", Difficulty: 71, TopASIN: "B09XQKLNMP", RelatedASINs: []string{"B09XQKLNMP"}},
	{Keyword: "baby white noise machine sounds", SearchVolume: 74000, Trend: 29, CPC: 0.92, Competition: "Medium", Difficulty: 53, TopASIN: "B0C1KZQPNM", RelatedASINs: []string{"B0C1KZQPNM"}},
	{Keyword: "ergonomic laptop stand foldable", SearchVolume: 62000, Trend: 21, CPC: 0.76, Competition: "Medium", Difficulty: 57, TopASIN: "B0BZNPKQMX", RelatedASINs: []string{"B0BZNPKQMX"}},
	{Keyword: "stem robot kit kids coding", SearchVolume: 52000, Trend: 52, CPC: 1.08, Competition: "Low", Difficulty: 45, TopASIN: "B0C1XZNPKQ", RelatedASINs: []string{"B0C1XZNPKQ"}},
	{Keyword: "gratitude journal 90 day planner", SearchVolume: 41000, Trend: 38, CPC: 0.49, Competition: "Low", Difficulty: 33, TopASIN: "B0C2NKQZXP", RelatedASINs: []string{"B0C2NKQZXP"}},
	{Keyword: "hiking backpack 45l waterproof", SearchVolume: 58000, Trend: 26, CPC: 0.84, Competition: "Medium", Difficulty: 62, TopASIN: "B0C2QZXMKP", RelatedASINs: []string{"B0C2QZXMKP"}},
	{Keyword: "mechanical keyboard compact rgb", SearchVolume: 78000, Trend: 19, CPC: 0.95, Competition: "High", Difficulty: 68, TopASIN: "B0BZQX7KLM", RelatedASINs: []string{"B0BZQX7KLM"}},
	{Keyword: "magnetic eyelashes natural look", SearchVolume: 67000, Trend: 48, CPC: 0.82, Competition: "Medium", Difficulty: 55, TopASIN: "B0BWZXQMPL", RelatedASINs: []string{"B0BWZXQMPL"}},
	{Keyword: "hair dryer ionic salon grade", SearchVolume: 94000, Trend: 27, CPC: 1.12, Competition: "High", Difficulty: 73, TopASIN: "B0C4ZKPQNX", RelatedASINs: []string{"B0C4ZKPQNX"}},
	{Keyword: "water flosser cordless rechargeable", SearchVolume: 53000, Trend: 36, CPC: 0.69, Competition: "Medium", Difficulty: 49, TopASIN: "B09XZQMKPN", RelatedASINs: []string{"B09XZQMKPN"}},
	{Keyword: "resistance band set home gym", SearchVolume: 118000, Trend: 15, CPC: 0.73, Competition: "High", Difficulty: 69, TopASIN: "B0C5NQXMKL", RelatedASINs: []string{"B0C5NQXMKL", "B0BZ4WXQKF"}},
}

// ---- History generators ----

func GenerateBSRHistory(startBSR int, trend string) []models.HistoryPoint {
	rng := rand.New(rand.NewSource(int64(startBSR)))
	current := float64(startBSR) + float64(rng.Intn(300))
	history := make([]models.HistoryPoint, len(months))
	for i, m := range months {
		var delta float64
		switch trend {
		case "rising":
			delta = -(float64(rng.Intn(50)) + 10)
		case "declining":
			delta = float64(rng.Intn(50)) + 10
		default:
			delta = float64(rng.Intn(40)) - 20
		}
		current = math.Max(30, current+delta)
		history[i] = models.HistoryPoint{Month: m, BSR: int(current)}
	}
	return history
}

func GeneratePriceHistory(basePrice float64) []models.HistoryPoint {
	rng := rand.New(rand.NewSource(int64(basePrice * 100)))
	history := make([]models.HistoryPoint, len(months))
	for i, m := range months {
		noise := (rng.Float64() - 0.5) * basePrice * 0.15
		price := math.Round((basePrice+noise)*100) / 100
		reviews := 100 + i*200 + rng.Intn(120)
		history[i] = models.HistoryPoint{Month: m, Price: price, Reviews: reviews}
	}
	return history
}

func GenerateSalesHistory(baseSales int, trend string) []models.HistoryPoint {
	rng := rand.New(rand.NewSource(int64(baseSales)))
	current := float64(baseSales)
	history := make([]models.HistoryPoint, len(months))
	for i, m := range months {
		var delta float64
		switch trend {
		case "rising":
			delta = +(float64(rng.Intn(400)) + 50)
		case "declining":
			delta = -(float64(rng.Intn(300)) + 30)
		default:
			delta = float64(rng.Intn(400)) - 200
		}
		current = math.Max(100, current+delta)
		revenue := math.Round(current * (float64(rng.Intn(30)) + 25))
		history[i] = models.HistoryPoint{Month: m, Sales: int(current), Revenue: revenue}
	}
	return history
}

func GenerateSearchVolumeHistory(base int, trend string) []models.HistoryPoint {
	rng := rand.New(rand.NewSource(int64(base)))
	current := float64(base)
	history := make([]models.HistoryPoint, len(months))
	for i, m := range months {
		var delta float64
		switch trend {
		case "rising":
			delta = float64(rng.Intn(base/10)) + float64(base/20)
		default:
			delta = float64(rng.Intn(base/8)) - float64(base/16)
		}
		current = math.Max(500, current+delta)
		history[i] = models.HistoryPoint{Month: m, Sales: int(current)} // reuse Sales field for volume
	}
	return history
}

// GetProductByASIN looks up a product by ASIN
func GetProductByASIN(asin string) (*models.Product, bool) {
	for i := range Products {
		if Products[i].ASIN == asin {
			return &Products[i], true
		}
	}
	return nil, false
}
