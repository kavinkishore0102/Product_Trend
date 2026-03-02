// ========== MOCK DATA FOR TRENDSPY ==========

export const mockProducts = [
    {
        asin: 'B09X7CRKRZ',
        name: 'Wireless Noise Cancelling Headphones Pro',
        image: '🎧',
        category: 'Electronics',
        brand: 'SoundMax',
        price: 89.99,
        bsr: 142,
        bsrCategory: 'Electronics > Headphones',
        monthlySales: 4820,
        monthlyRevenue: 433920,
        reviews: 12480,
        rating: 4.5,
        sellerCount: 3,
        trend: 'rising',
        trendPct: 23,
        launchDate: '2022-09',
        productScore: 87,
    },
    {
        asin: 'B0BJLF2BRM',
        name: 'Portable Mini Projector 4K HD',
        image: '📽️',
        category: 'Electronics',
        brand: 'ViewPro',
        price: 149.99,
        bsr: 389,
        bsrCategory: 'Electronics > Projectors',
        monthlySales: 2940,
        monthlyRevenue: 440970,
        reviews: 7230,
        rating: 4.3,
        sellerCount: 6,
        trend: 'rising',
        trendPct: 41,
        launchDate: '2022-11',
        productScore: 79,
    },
    {
        asin: 'B0C1FR57NJ',
        name: 'Bamboo Bathroom Organizer Set (5-Piece)',
        image: '🪣',
        category: 'Home & Kitchen',
        brand: 'NaturCasa',
        price: 34.99,
        bsr: 207,
        bsrCategory: 'Home & Kitchen > Bathroom Accessories',
        monthlySales: 6100,
        monthlyRevenue: 213490,
        reviews: 3450,
        rating: 4.7,
        sellerCount: 12,
        trend: 'stable',
        trendPct: 4,
        launchDate: '2023-02',
        productScore: 82,
    },
    {
        asin: 'B0BZ4WXQKF',
        name: 'Adjustable Dumbbell Set 55lb',
        image: '🏋️',
        category: 'Sports & Outdoors',
        brand: 'FitForce',
        price: 219.99,
        bsr: 98,
        bsrCategory: 'Sports > Strength Equipment',
        monthlySales: 3800,
        monthlyRevenue: 835962,
        reviews: 9870,
        rating: 4.6,
        sellerCount: 2,
        trend: 'rising',
        trendPct: 18,
        launchDate: '2022-06',
        productScore: 91,
    },
    {
        asin: 'B0C9WNXRV3',
        name: 'LED Desk Lamp with Wireless Charging',
        image: '💡',
        category: 'Home & Kitchen',
        brand: 'LumiDesk',
        price: 44.99,
        bsr: 321,
        bsrCategory: 'Home & Kitchen > Lighting',
        monthlySales: 5200,
        monthlyRevenue: 233948,
        reviews: 4320,
        rating: 4.4,
        sellerCount: 8,
        trend: 'declining',
        trendPct: -12,
        launchDate: '2023-01',
        productScore: 68,
    },
    {
        asin: 'B0BVXQKTFW',
        name: 'Insulated Stainless Steel Water Bottle 40oz',
        image: '🍶',
        category: 'Sports & Outdoors',
        brand: 'HydroFlow',
        price: 29.99,
        bsr: 56,
        bsrCategory: 'Sports > Water Bottles',
        monthlySales: 8900,
        monthlyRevenue: 266911,
        reviews: 22100,
        rating: 4.8,
        sellerCount: 4,
        trend: 'rising',
        trendPct: 31,
        launchDate: '2022-03',
        productScore: 94,
    },
    {
        asin: 'B0C3XQPWMN',
        name: 'Pet Grooming Vacuum Kit',
        image: '🐕',
        category: 'Pet Supplies',
        brand: 'PawClean',
        price: 59.99,
        bsr: 174,
        bsrCategory: 'Pet Supplies > Grooming',
        monthlySales: 3650,
        monthlyRevenue: 218964,
        reviews: 5780,
        rating: 4.5,
        sellerCount: 5,
        trend: 'rising',
        trendPct: 57,
        launchDate: '2023-04',
        productScore: 85,
    },
];

export const generateBsrHistory = (startBsr = 500, trend = 'rising') => {
    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    let current = startBsr + Math.random() * 300;
    return months.map((month) => {
        const delta = trend === 'rising' ? -Math.random() * 40 : trend === 'declining' ? Math.random() * 40 : (Math.random() - 0.5) * 30;
        current = Math.max(50, current + delta);
        return { month, bsr: Math.round(current) };
    });
};

export const generatePriceHistory = (basePrice = 49.99) => {
    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    return months.map((month, i) => ({
        month,
        price: parseFloat((basePrice + (Math.random() - 0.5) * basePrice * 0.15).toFixed(2)),
        review: 120 + i * 180 + Math.round(Math.random() * 80),
    }));
};

export const generateSalesHistory = (baseSales = 3000, trend = 'rising') => {
    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    let current = baseSales;
    return months.map((month) => {
        const delta = trend === 'rising' ? Math.random() * 300 : trend === 'declining' ? -Math.random() * 200 : (Math.random() - 0.5) * 250;
        current = Math.max(200, current + delta);
        return { month, sales: Math.round(current), revenue: Math.round(current * (Math.random() * 30 + 30)) };
    });
};

export const mockKeywords = [
    { keyword: 'wireless headphones noise cancelling', searchVolume: 184000, trend: 22, cpc: 1.42, competition: 'High', difficulty: 78, topASIN: 'B09X7CRKRZ' },
    { keyword: 'mini projector 4k', searchVolume: 72000, trend: 45, cpc: 0.98, competition: 'Medium', difficulty: 56, topASIN: 'B0BJLF2BRM' },
    { keyword: 'portable projector for bedroom', searchVolume: 38000, trend: 67, cpc: 0.74, competition: 'Medium', difficulty: 48, topASIN: 'B0BJLF2BRM' },
    { keyword: 'bamboo bathroom organizer', searchVolume: 28500, trend: 8, cpc: 0.55, competition: 'Low', difficulty: 31, topASIN: 'B0C1FR57NJ' },
    { keyword: 'adjustable dumbbells set', searchVolume: 110000, trend: 19, cpc: 1.87, competition: 'High', difficulty: 72, topASIN: 'B0BZ4WXQKF' },
    { keyword: 'desk lamp wireless charging', searchVolume: 54000, trend: -8, cpc: 0.88, competition: 'Medium', difficulty: 61, topASIN: 'B0C9WNXRV3' },
    { keyword: 'insulated water bottle 40oz', searchVolume: 210000, trend: 33, cpc: 0.65, competition: 'High', difficulty: 82, topASIN: 'B0BVXQKTFW' },
    { keyword: 'pet hair vacuum grooming kit', searchVolume: 89000, trend: 61, cpc: 1.12, competition: 'Medium', difficulty: 54, topASIN: 'B0C3XQPWMN' },
    { keyword: 'dog grooming vacuum attachment', searchVolume: 42000, trend: 73, cpc: 0.93, competition: 'Low', difficulty: 42, topASIN: 'B0C3XQPWMN' },
    { keyword: 'hydroflask alternative water bottle', searchVolume: 67000, trend: 28, cpc: 0.71, competition: 'Medium', difficulty: 59, topASIN: 'B0BVXQKTFW' },
];

export const mockReverseAsinKeywords = (asin) => {
    const base = mockKeywords.filter(k => k.topASIN === asin);
    const extra = [
        { keyword: 'best ' + asin.slice(-4) + ' product', searchVolume: Math.round(Math.random() * 30000 + 5000), trend: Math.round(Math.random() * 40 - 10), cpc: parseFloat((Math.random() + 0.4).toFixed(2)), competition: 'Low', difficulty: Math.round(Math.random() * 40 + 20), organicRank: Math.round(Math.random() * 20 + 1), sponsoredRank: Math.round(Math.random() * 5 + 1) },
        { keyword: 'buy ' + asin.slice(-4), searchVolume: Math.round(Math.random() * 15000 + 2000), trend: Math.round(Math.random() * 20 - 5), cpc: parseFloat((Math.random() * 1.5 + 0.3).toFixed(2)), competition: 'Medium', difficulty: Math.round(Math.random() * 30 + 30), organicRank: Math.round(Math.random() * 50 + 1), sponsoredRank: null },
    ];
    return [...base.map(k => ({ ...k, organicRank: Math.round(Math.random() * 15 + 1), sponsoredRank: Math.round(Math.random() * 4 + 1) })), ...extra];
};

export const generateSearchVolumeHistory = (base = 50000, trend = 'rising') => {
    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    let current = base;
    return months.map(month => {
        const delta = trend === 'rising' ? Math.random() * base * 0.08 : (Math.random() - 0.5) * base * 0.1;
        current = Math.max(1000, current + delta);
        return { month, volume: Math.round(current) };
    });
};

export const formatNumber = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
};

export const formatCurrency = (n) => {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
    return '$' + n.toFixed(2);
};
