/* Hackbridge Ends — runtime text localiser.
   Plain script (no import/export) so it loads in classic workers (importScripts),
   module workers/pages (import "./hb-text.js") and via <script>.
   Translates leftover CJK strings drawn on canvas / shown in DOM into invented British
   (SM6 estate) names. Deterministic: same input -> same output. */
(function (g) {
  'use strict';
  if (g.__hbText) return;

  var CJK = /[\u2e80-\u2fff\u3000-\u30ff\u3100-\u312f\u3190-\u31ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/;
  var CJK_G = /[\u2e80-\u2fff\u3000-\u30ff\u3100-\u312f\u3190-\u31ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]+/g;
  var LATIN_BAD = /Taipei|TAIPEI|Taiwan|TAIWAN|Keelung|Tamsui|Xinyi|Zhongshan|Longshan|Shilin|Ximending|Ximen|Dadaocheng|Songshan|Wanhua|Datong|Zhongzheng|Beitou|Neihu|Nangang|Daan|Da'an/;

  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function pick(pool, s, salt) { return pool[hash(s + (salt || '')) % pool.length]; }

  /* ---------------- pools of invented British names ---------------- */
  var P = {
    chicken: ["Dixie Wings", "Mr Crispy Chicken", "Wing Shack", "Cluckin' Good", "Piri Piri Palace", "Chicken & Ribs Hut", "Fried Chicken King", "Roost Chicken", "Southern Fried Co.", "Hot Wings Hub", "Peckish Chicken", "Wings & Things"],
    chippy: ["Golden Fry Chippy", "Neptune Fish Bar", "The Salty Cod", "Sea Breeze Fish & Chips", "Pier Fish Bar", "Fryer Tuck's", "Harbour Chippy", "Crispy Cod Fish Bar", "Cod Almighty", "The Plaice To Be"],
    kebab: ["Sultan's Kebab", "Anatolia Grill", "Istanbul Express", "Ocakbasi Grill", "Kebab Palace", "Doner King", "Bosphorus Kebab", "Mangal Grill", "Shish Express", "Hot Doner House"],
    chinese: ["Lucky Wok", "Golden Palace Chinese", "Jade Garden Takeaway", "Happy Dragon Takeaway", "Wok This Way", "Hong Kong Express", "Lucky Star Chinese", "Number One Wok", "Sweet Bamboo Takeaway", "Dragon Pearl Takeaway"],
    pie: ["Pie & Mash House", "Cockney Pie Shop", "Hot Pie Co.", "Gravy Train Pies", "Eel & Mash Parlour", "Old Smoky Pie Shop"],
    caff: ["Rita's Caff", "Pit Stop Cafe", "Sunrise Cafe", "The Greasy Spoon", "Big Mick's Caff", "Corner Cafe", "Full English Cafe", "Brew & Bacon", "Terry's Tea Rooms", "Early Bird Caff", "Tea & Toast Cafe"],
    boba: ["Bubble Tea Bar", "Boba Boys", "Pearl Tea House", "Milk Tea Express", "Sip Sip Bubble Tea", "Tapioca Time"],
    coffee: ["Flat White Co.", "Bean There", "Daily Grind", "Roast & Toast", "Brew Lab", "Barista Bros", "Espresso Yourself", "Pour Over"],
    bakery: ["Crusty's Bakery", "Sausage Roll Co.", "Baker's Dozen", "The Bread Basket", "Dough Boys Bakery", "Oven Fresh Bakery", "Warm Rolls Bakery"],
    icecream: ["Frosty's Ice Cream", "Sundae Best", "Lolly Shop", "Ice Cream Parlour", "Cool Cones", "Choc Ice Cafe"],
    sweets: ["Quality Sweets", "Penny Sweets", "Sweet Corner", "Pick 'n' Mix Shop", "Sweet Tooth"],
    pub: ["The Crown & Anchor", "The Royal Oak", "The Fox & Hounds", "The Plough", "The Wheatsheaf", "The Dog & Duck", "The Black Horse", "The Nag's Head", "The Railway Tavern", "The Swan"],
    offlic: ["Booze & News", "Late Night Wines & Spirits", "Cheers Off Licence", "24H Off Licence", "Corner Wines", "Spirits & Wine"],
    shop: ["Express Mini Market", "Corner Shop", "Day & Night Store", "Mo's Mini Mart", "Pound Plus Stores", "Newsagents & Lottery", "Local Store", "Ali's Food & Wine", "City Express Store"],
    barber: ["Fade Lab", "Sharp Cutz", "Mr Fade Barbers", "Clean Cut Barbers", "Turkish Barbers", "Skin Fade Studio", "Kings Cutz", "Crown Barbers", "Lineup Barbers", "Razor's Edge"],
    salon: ["Cut & Curl", "Hair by Tasha", "Hair Zone", "Braids & Weaves", "Glam Hair Studio", "Shear Delight"],
    bookie: ["Winning Post Bookmakers", "Lucky Bet", "Odds On", "Fast Track Betting", "Accumulator Bookmakers", "Sure Thing Betting"],
    chemist: ["Wellbeing Pharmacy", "Corner Chemist", "High Street Pharmacy", "Pharmacy & Health", "Healthwise Chemist"],
    dentist: ["Smile Dental Surgery", "Dental Care", "Bright Smile Dentist", "Family Dental Practice"],
    clinic: ["Medical Centre", "GP Surgery", "Health Centre", "Walk-in Clinic", "Skin Clinic"],
    pawn: ["Cash 4 Gold", "Pawn Brokers", "Quick Cash Jewellers", "Gold Exchange", "Gold Buyers"],
    jewel: ["Diamond House Jewellers", "Gold & Silver Jewellers", "Bling Bros Jewellers", "Karat Jewellers"],
    phone: ["Mobile Fix", "Phone Repair & Unlock", "Unlock Zone", "Cellular World", "Screen Doc", "Tech Fix"],
    games: ["Game Swap", "Retro Games Exchange", "Pixel Zone Arcade", "Arcade Amusements", "Level Up Games"],
    comic: ["Comic Corner", "Anime Hub", "Collectables Cave", "Toy Box Collectables"],
    clothes: ["Streetwear Outlet", "Trackie Town", "Drip Wholesale", "Garment Warehouse", "Vintage Vault", "Tailor & Alterations", "Wholesale Clothing"],
    shoes: ["Kicks & Co", "Trainer Vault", "Sole Trader", "Shoe Repair & Keys"],
    fabric: ["Fabric Warehouse", "Material World", "Remnants Fabrics"],
    optic: ["Eyecare Opticians", "Specs & Co", "Clear View Opticians", "Lens Lab Opticians"],
    watch: ["Time Watch Repairs", "Watch & Clock Repair", "Timeless Watches"],
    books: ["Book Exchange", "Second Hand Books", "Corner Bookshop", "Pages Bookshop"],
    print: ["Print & Copy", "Quick Print", "Copy Centre", "Print Shop"],
    hardware: ["Hardware & Keys", "DIY & Hardware", "Nuts & Bolts Hardware", "Tool Shop", "Locksmith & Keys"],
    tyre: ["Tyres & MOT", "Fast Tyres", "Auto Repairs MOT", "Motor Spares", "Garage & MOT"],
    bike: ["Bike Shop", "Cycle Repairs", "Pedal Power Cycles"],
    hotel: ["Budget Hotel", "Rest Inn B&B", "Station Hotel", "Night Stop Lodge", "Guest House"],
    estate: ["Estate Agents", "Lettings & Sales", "Property Shop", "Homes 4 U Estates", "Keys Estate Agents"],
    tuition: ["Tuition Centre", "Maths Tutors", "Learning Centre", "Study Hub", "After School Club"],
    school: ["Hackbridge Academy", "Community Primary School", "St Mark's School", "Secondary School"],
    church: ["Community Church", "Parish Hall", "Gospel Hall", "Community Centre", "Faith Centre"],
    tattoo: ["Ink Studio", "Tattoo & Piercing", "Black Ink Tattoos", "Needle & Ink"],
    club: ["Karaoke Lounge", "Night Club", "Late Bar", "Club Zero", "Sound Lounge", "Lock-In Bar"],
    laundry: ["Launderette", "Wash & Dry", "Suds Launderette", "Dry Cleaners"],
    bank: ["Savings Bank", "High Street Bank", "Building Society", "Cashpoint"],
    post: ["Post Office", "Mail Centre", "Parcel Point"],
    market: ["Market Stalls", "Street Market", "Indoor Market", "Wholesale Market"],
    grocer: ["Fruit & Veg", "Greengrocers", "Market Fruit", "Fresh Produce"],
    butcher: ["Halal Butchers", "Fishmongers", "Butchers & Deli"],
    florist: ["Florist", "Flowers & Gifts"],
    pet: ["Pet Shop", "Paws & Claws Grooming", "Pet Supplies"],
    beauty: ["Nails & Beauty", "Beauty Bar", "Lash & Brow Studio", "Nail Lounge", "Glow Beauty"],
    massage: ["Thai Massage", "Spa & Massage", "Wellness Centre"],
    gym: ["Boxing Gym", "Fitness Centre", "Iron Gym"],
    elec: ["Electrical Goods", "Appliance Warehouse", "White Goods Outlet"],
    furn: ["Furniture Warehouse", "Beds & Sofas", "Carpet & Flooring"],
    gift: ["Gifts & Cards", "Card Shop", "Party Supplies"],
    build: ["Building Supplies", "Scaffolding Ltd", "Construction Ltd", "Property Developments", "Engineering Works"],
    courier: ["Courier Depot", "Parcel Depot"],
    psychic: ["Psychic Readings", "Tarot & Palm Reading", "Spiritual Advisor"],
    acct: ["Accountants", "Insurance Brokers", "Tax Advice"],
    legal: ["Solicitors", "Law Centre"],
    cinema: ["Picture House", "Showtime Cinema"],
    council: ["Council Offices", "Ward Office", "Community Hub", "Job Centre"],
    clean: ["Cleaning Services", "Pest Control"],
    photo: ["Photo Booth", "Passport Photos"],
    arcade: ["Arcade Machines", "Claw Machines 24H"],
    whole: ["Cash & Carry", "Wholesale", "Trade Counter"],
    super: ["Supermarket", "Pound Shop", "Fresh Foods Market"],
    hospital: ["A&E", "Hospital"],
    slogan: ["OPEN 7 DAYS", "CASH ONLY", "EVERYTHING MUST GO", "FRESH DAILY", "BACK IN 5 MINS", "BEST PRICES", "NO LOITERING", "CCTV IN OPERATION", "GRAND OPENING", "BIG SAVINGS", "LOCAL & PROUD", "OPEN LATE"],
    sale: ["SALE NOW ON", "BIG SALE", "EVERYTHING HALF PRICE", "CLEARANCE SALE", "2 FOR £5"],
    street: ["High Street", "Mill Road", "Station Road", "Church Lane", "Bridge Street", "Wandle Road", "London Road", "Beddington Lane", "Hill Road", "Park Lane"],
    coach: ["Coach Station", "Bus Garage", "Travel Centre", "Ticket Office"],
    generic: ["Corner Shop", "Mini Market", "Newsagents", "Local Store", "Off Licence", "Launderette", "Kebab House", "Chicken & Chips", "Barbers", "Cafe"]
  };

  /* menu items (priced strings) */
  var M = {
    noodle: ["Chow Mein", "Beef Noodle Soup", "Egg Noodles", "Singapore Noodles"],
    rice: ["Egg Fried Rice", "Rice & Peas", "Jollof Rice", "Curry & Rice", "Special Fried Rice"],
    dump: ["Dumplings (6)", "Steamed Buns", "Pasty", "Sausage Roll", "Spring Rolls"],
    chick: ["Wings (6)", "Chicken & Chips", "Burger & Chips", "Fried Chicken Box", "Hot Wings"],
    fish: ["Cod & Chips", "Fish Fingers", "Scampi & Chips", "Battered Sausage"],
    drink: ["Cuppa Tea", "Milk Tea", "Bubble Tea", "Cold Drink", "Hot Chocolate", "Flat White", "Latte"],
    sweet: ["Ice Lolly", "Ice Cream", "Sticky Toffee Pudding", "Apple Pie", "Doughnut", "Flapjack"],
    brek: ["Bacon Butty", "Egg & Bacon Roll", "Beans on Toast", "Sausage Sandwich", "Full English"],
    soup: ["Soup of the Day", "Chicken Soup", "Tomato Soup"],
    grill: ["Kebab", "Shish Kebab", "Hot Dog", "Sausage in a Bun", "Saveloy"],
    pot: ["Hot Pot", "Stew & Dumplings"],
    other: ["Chips", "Gravy", "Mixed Grill", "Today's Special", "Meal Deal"]
  };

  /* ---------------- exact dictionary ---------------- */
  var EXACT = {
    '站': 'STN', '捷運': 'TRAM', '計程車': 'TAXI', '空車': 'FOR HIRE', '警察': 'POLICE', '警 察': 'POLICE', '警察局': 'POLICE STATION',
    '臺北小黃 計程車': 'BLACK CAB TAXI', '臺北市': 'HACKBRIDGE', '臺北': 'HACKBRIDGE', '台北': 'HACKBRIDGE',
    'TAXI · 24H 叫車 (02)5566-8899': 'TAXI · 24H · 020 7946 0813',
    '北都客運  TAIPEI CITY BUS': 'HACKBRIDGE BUS', '♿ 低地板公車': '♿ LOW FLOOR BUS',
    '臺北市政府警察局': 'METRO POLICE', '萬華分局': 'SM6 DIVISION', '警察  POLICE': 'POLICE', '警察 POLICE': 'POLICE',
    '救護車 119': 'AMBULANCE 999', '垃圾車': 'BIN LORRY', '資源回收 · 請做好垃圾分類': 'RECYCLING · PLEASE SORT YOUR WASTE',
    '黑喵宅配': 'BLACK CAT COURIERS', '阿明水電行': "MIKE'S PLUMBING & ELECTRICS", '專業水電 (02)2345-6789': 'PLUMBER · SPARKY · 020 7946 0111',
    '胖達外送': 'SCRAN EXPRESS', '熊愛送': 'MUNCH DASH', '餓熊外送': 'HUNGRY BEAR EATS', '猛狼': 'WOLFPACK', '霹靂小組': 'ARMED RESPONSE', 'SWAT · 保安警察': 'ARMED POLICE',
    '基隆河 Keelung River': 'River Wandle', '捷運人 MRT People': 'Tram People', '出口 Exit': 'Exit', '往月台': 'To Platform',
    '悠悠卡': 'Oyster-style Card', '嗶一下 就出發': 'Tap in. Go.', '嗶一下': 'Tap in', '就出發': 'Go.',
    '捷運站出口旁': 'Next to the station exit', '售票 · 詢問處': 'Tickets · Enquiries', '售票 Tickets': 'Tickets',
    '臺北捷運 路網圖  Route Map': 'Hackbridge Rail · Route Map', '月台': 'Platform', '捷': 'T', '運': 'R',
    '即將進站': 'Approaching', '2 分': '2 min', '警察局': 'POLICE STATION', '內政部空中勤務總隊': 'NATIONAL POLICE AIR SERVICE',
    '警察臨檢': 'POLICE STOP', '停車受檢': 'PULL OVER',
    '垃': 'B', '明': '★', '送': 'D', '載': 'T', '珍': 'B', '飆': 'R', '賊': 'T', '年': 'Y', '廟': '+', '搶': '!', '囍': 'W', '偵': 'D', '急': '!', '拍': 'P', '技': 'S', '停': 'P', '吃': 'F', '籤': '?', '劇': 'S', '福': 'L', '店': 'S', '餐': 'F', '茶': 'T', '包': 'B', '家': 'H', '任': '!',
    '土地公': 'SHRINE', '福德正神': 'SHRINE', '和平': 'HIGH ST', '八德': 'BRIDGE RD',
    'ROLEXE 名錶': 'WATCHES', '統一超商': 'EXPRESS STORE', '歡迎光臨  自動門': 'WELCOME · AUTO DOOR', '取物口 PUSH': 'COLLECT HERE',
    '熱食 HOT FOOD': 'HOT FOOD', '歡迎刷卡': 'CARDS ACCEPTED', '限時優惠': 'LIMITED OFFER', '買二送一': '2 FOR 1', '招牌': 'SIGN',
    '休息': 'REST', '住宿': 'ROOMS', '早餐': 'BREAKFAST', '便當': 'MEAL DEAL', '公車': 'BUS', '區間': 'LOCAL', '登車中': 'BOARDING',
    '一般垃圾': 'GENERAL WASTE', '許可證 No.0925': 'LICENCE No.0925', '全新': 'NEW', '限量': 'LIMITED', '限量新品': 'NEW IN', '甜點 輕食': 'DESSERTS & SNACKS',
    '24H 櫃台': '24H DESK', '臺中': 'Birmingham', '宜蘭': 'Brighton', '臺南': 'Bristol', '高雄': 'Manchester', '新竹': 'Reading', '桃園': 'Croydon', '花蓮': 'Cardiff', '基隆': 'Dover', '臺東': 'Plymouth', '臺中 朝馬': 'Birmingham', '宜蘭 羅東': 'Brighton', '車': 'R', '馬': 'N', '炮': 'C', '兵': 'P', '將': 'K', '士': 'A', '象': 'B', '相': 'B', '帥': 'K', '仕': 'A', '卒': 'P', '楚河　　漢界': 'THE RIVER', '楚河        漢界': 'THE RIVER', '口': 'EXIT', '禮': 'G', '請選擇': 'SELECT', '路線': 'ROUTES', '發車': 'DEPARTS', '客運': 'COACHES', '新品': 'NEW IN', '熱賣': 'HOT SELLER', '臺北轉運站': 'COACH STATION', '身障 優先': 'PRIORITY SEATS', '售票機': 'TICKET MACHINE', '臺鐵': 'NATIONAL RAIL', '玩臺灣': 'EXPLORE BRITAIN', '門': 'DOOR', '入境': 'ARRIVALS', '出境': 'DEPARTURES', '珍煮紅': 'Bubble Tea', '週年慶': 'ANNIVERSARY SALE', '週年慶大特價': 'ANNIVERSARY SALE', '嘉義': 'Hackbridge', '大南路': 'Mill Road', '大南路老街': 'Mill Road', '會員點數': 'MEMBERS POINTS', '全館 8 折起': 'UP TO 20% OFF', '會員 9 折': 'MEMBERS 10% OFF'
  };
  var KEEP_LATIN = /^(KTV|DJ|INK|TAXI|POLICE|SWAT|PUSH|EXIT|WC|ATM|LED|VIP|24H|3C|NO|PM|AM)$/i;

  /* ---------------- single-character map icons ---------------- */
  /* ---------------- category rules (first match wins) ---------------- */
  var RULES = [
    [/客運|轉運|巴士|公車|售票|發車|航空|機場|港|碼頭|渡輪/, 'coach'],
    [/[路街巷道弄段橋]$|[路街巷道弄段橋] ?\d/, 'street'],
    [/特價|優惠|折扣|折起|大放送|清倉|促銷|週年慶|買一送一|限時|特賣|大拍賣/, 'sale'],
    [/警察|派出所|分局|刑事/, 'POLICE'],
    [/學校|國小|國中|高中|大學|學院|幼稚園|附中|校園|學府/, 'school'],
    [/補習|才藝|安親|教室|文理|數理|書院|美語/, 'tuition'],
    [/醫院|急診|榮總|馬偕/, 'hospital'],
    [/牙醫|植牙|牙科|矯正/, 'dentist'],
    [/診所|皮膚科|醫美|眼科|耳鼻喉|小兒科|內科|外科|中醫|針灸|復健|健保|疫苗|衛生/, 'clinic'],
    [/藥局|藥師|藥妝|藥房|中藥|草藥|青草|藥材|藥行|處方/, 'chemist'],
    [/當舖|典當|金紙行?當/, 'pawn'],
    [/銀樓|珠寶|金飾|首飾|黃金/, 'jewel'],
    [/銀行|郵局|儲蓄|信用|農會|合作社|金庫/, 'bank'],
    [/金紙|香舖|香 燭|佛具|神明|寺|廟|宮|堂|祠|媽祖|觀音|佛|道|教會|禮拜|福德|土地公|拜拜|香燭|籤/, 'church'],
    [/刺青|穿環|紋身/, 'tattoo'],
    [/理髮|剪髮|洗剪|修面|髮廊|美髮|髮型|染燙|髮藝/, 'barber'],
    [/美甲|美睫|美容|沙龍|護膚|保養|彩妝|美妝|SPA/, 'beauty'],
    [/按摩|足體|足浴|養生館|推拿|刮痧/, 'massage'],
    [/健身|拳擊|瑜珈|舞蹈|運動|球場|籃球|游泳|武術/, 'gym'],
    [/彩券|運彩|樂透|威力彩|賭|麻將|博弈/, 'bookie'],
    [/KTV|卡拉|酒店|舞廳|夜店|俱樂部|酒吧|Lounge|club|PUB|Pub|pub|酒場|居酒屋|燒酒|啤酒屋|串燒酒/, 'pub'],
    [/酒行|酒莊|酒窖|洋酒|煙酒|菸酒|酒類/, 'offlic'],
    [/旅社|旅館|飯店|客棧|民宿|住宿|休息|旅店|旅舍|青年旅|賓館|大飯店|晶華/, 'hotel'],
    [/房屋|仲介|地產|房仲|買屋|賣屋|租屋|不動產|建設|建商/, 'estate'],
    [/電影|戲院|影城|劇場|劇院|表演|音樂廳/, 'cinema'],
    [/電玩|遊戲|彈珠|夾娃娃|娃娃機|撞球|桌遊|遊樂|拍貼|大頭貼|機台|機臺/, 'games'],
    [/動漫|公仔|模型|玩具|扭蛋|漫畫|玩偶|積木|卡牌|收藏/, 'comic'],
    [/手機|通訊|3C|電腦|資訊|數位|電子|光華|組裝|維修|相機|攝影|耳機|平板|筆電/, 'phone'],
    [/眼鏡|驗光|配鏡|隱形/, 'optic'],
    [/鐘錶|錶|時鐘|鐘表|名錶/, 'watch'],
    [/書店|書局|書坊|書房|圖書|文具|文化|出版|雜誌|二手書|書城/, 'books'],
    [/影印|印刷|裝訂|護貝|名片|印章|刻印|快印|速印|輸出|刻章/, 'print'],
    [/五金|水電|工具|鑰匙|鎖|鐵工|鐵材|鋁門|機械|電器行|電線|燈具|燈飾|油漆|建材|木材|玻璃|磁磚|衛浴/, 'hardware'],
    [/機車|輪胎|補胎|汽車|車行|修車|車業|保養廠|洗車|烤漆|停車|車體|機車行|車材|汽機車/, 'tyre'],
    [/單車|腳踏車|自行車/, 'bike'],
    [/洗衣|乾洗|洗水|自助洗/, 'laundry'],
    [/家電|冷氣|冰箱|電視|音響|洗衣機|電器|空調/, 'elec'],
    [/傢俱|家具|寢具|床墊|地毯|窗簾|沙發|家飾|傢飾|居家/, 'furn'],
    [/布莊|布行|布業|布料|紡織|織品|服飾材料|拉鍊|鈕扣|毛線/, 'fabric'],
    [/鞋|帆布鞋|球鞋|拖鞋|皮鞋|鞋包|包包|皮件|皮包|行李|箱包/, 'shoes'],
    [/服飾|服裝|成衣|時裝|女裝|男裝|童裝|內衣|襪|古著|制服|婚紗|禮服|旗袍|西服|洋裝|衣|裁縫|改衣|訂製/, 'clothes'],
    [/花店|花藝|花坊|花卉|乾燥花|盆栽|園藝/, 'florist'],
    [/寵物|毛孩|狗|貓|水族|魚缸|飼料/, 'pet'],
    [/禮品|禮盒|紀念品|文創|精品|飾品|雜貨|派對|氣球|婚禮|喜餅|紅包|囍/, 'gift'],
    [/算命|命理|卜卦|八字|占卜|塔羅|風水|紫微|易經|相命|手相/, 'psychic'],
    [/會計|記帳|保險|稅務|代書|報關|地政|仲裁|徵信/, 'acct'],
    [/律師|法律|法務|公證/, 'legal'],
    [/清潔|消毒|除蟲|抓漏|搬家|水塔|通水管|鐵捲門|隔間|裝潢|室內設計|工程|營造|土木|施工|鋼構|營建/, 'clean'],
    [/宅配|物流|貨運|快遞|郵務|倉儲|運輸|速遞|貨櫃|配送/, 'courier'],
    [/批發|南北貨|盤商|貿易|商行|商號|行號|進口|代理/, 'whole'],
    [/超市|量販|大賣場|生活館|全聯|賣場|福利中心|福利社|商場|百貨|商城/, 'super'],
    [/超商|便利|雜貨店|柑仔店|小店|商店|日用品/, 'shop'],
    [/市場|攤|夜市|黃昏|傳統市場|市集|夜巿/, 'market'],
    [/水果|蔬果|青果|菜行|蔬菜|果行|果菜|生鮮|菜販|鮮蔬/, 'grocer'],
    [/肉攤|肉鋪|肉舖|豬肉|牛肉攤|羊肉|魚販|魚攤|海鮮行|屠|肉品|雞肉攤|水產行|魚行/, 'butcher'],
    [/鳳梨酥|喜餅|麵包|烘焙|蛋糕|西點|吐司|餅店|餅行|糕餅|餅舖|酥|月餅|麵包店|甜甜圈|可頌|泡芙/, 'bakery'],
    [/冰淇淋|冰品|冰店|雪花冰|剉冰|冰館|霜淇淋|冰棒|冰沙|圓仔冰|豆花|愛玉|仙草|芋圓|燒仙草|雪片冰|綿綿冰|冰城|冰果室|粉圓|布丁|甜品|甜湯|糖水/, 'icecream'],
    [/糖果|糖行|蜜餞|零食|巧克力|軟糖|糖菓|乾貨|麻糬|喜糖|牛軋糖|果乾|堅果|肉乾|肉鬆|蜜/, 'sweets'],
    [/珍珠|珍奶|奶茶|波霸|手搖|飲料|茶飲|飲品|鮮奶|茶坊|茶行|茶舖|青茶|紅茶|綠茶|烏龍|茶莊|茶店|茗茶|茶藝|茶屋/, 'boba'],
    [/咖啡|COFFEE|Coffee|coffee|珈琲|拿鐵|手沖|虹吸|烘豆|義式|Cafe|cafe|CAFE|café|咖啡館|咖啡廳/, 'coffee'],
    [/早餐|早午餐|蛋餅|燒餅|油條|豆漿|飯糰|蘿蔔糕|鐵板麵|三明治|漢堡|吐司店|美而美|早點|早安|晨間|brunch|Brunch/, 'caff'],
    [/炸雞|雞排|鹹酥雞|鹽酥雞|唐揚|炸物|炸串|大雞排|雞腿|雞翅|雞肉|雞心|烤雞|甜不辣|香雞|脆皮|雞蛋糕|雞/, 'chicken'],
    [/魚|蝦|蚵|魷|海產|海鮮|螃蟹|花枝|章魚|干貝|龍蝦|蛤|蟹|鯖|鰻|鮮魚|生魚|壽司|丼|刺身|握壽|日式|和食|和牛|燒鳥|焼鳥|燒肉|定食|日本料理|拉麵|烏龍麵|串燒|大阪|東京|札幌|まる|とり|屋台/, 'chippy'],
    [/沙威瑪|土耳其|烤肉|串|烤|滷味|滷|燒烤|炭烤|羊肉爐|沙嗲|燒|炙|BBQ|bbq|烤鴨|鴨/, 'kebab'],
    [/水餃|鍋貼|煎餃|餃|小籠|湯包|包子|燒賣|燒麥|饅頭|蒸餃|肉包|餛飩|抄手|點心|飲茶|港式|廣式|川菜|粵|湘|麻辣|火鍋|鍋|熱炒|快炒|中餐|川味|客家|上海|北方|京|蒙古|牛肉麵|麵|米粉|粿|粥|飯|蔥油餅|肉羹|羹|魯肉|滷肉|控肉|焢肉|雞肉飯|便當|排骨|麵線|湯|臭豆腐|粉|餅|飴|蛋|豆|腐|蒸|炒|煮|炸|煎|滷|拌/, 'chinese'],
    [/餐廳|小吃|食堂|飲食|美食|廚房|料理|餐館|餐飲|食|館|麵店|飯店|菜館|小館|吃|擔仔|碗粿|魯|鹹|甜|辣|香/, 'caff'],
    [/市政府|議會|立法|司法|監察|考試|行政|公所|區公所|戶政|稅捐|里長|服務處|辦公|局|處|部|院|署|會館|公會|協會|基金會|中心/, 'council'],
    [/公園|廣場|紀念|博物館|美術館|文化|古蹟|歷史|故居|園區|展覽|劇場|圖書館|運動中心|體育|大樓|大廈|大樓/, 'council'],
    [/店|行|舖|屋|坊|社|室|莊|號|樓|閣|軒|齋|苑|場|廳|所|園/, 'shop']
  ];

  var ITEM_RULES = [
    [/鍋/, 'pot'],
    [/麵|米粉|麵線|拉麵|粿條|河粉|烏龍麵|義大利麵/, 'noodle'],
    [/湯|羹|酸辣|粥|濃湯/, 'soup'],
    [/飯|便當|炒飯|丼|飯糰|燴/, 'rice'],
    [/餃|包|燒賣|燒麥|小籠|湯包|餅|捲|派|酥|粽|餛飩|鍋貼|水煎|蝦餅|春捲|蘿蔔糕|芋頭糕|糕/, 'dump'],
    [/雞|排骨|炸|鹹酥|鴨|腿|翅|排|香腸|腸|腰|肉|牛|豬|羊|培根|火腿|蝦仁|焢/, 'chick'],
    [/魚|蝦|蚵|魷|海|蟹|花枝|鯖|鱈|鰻|蛤|干貝|章魚|壽司|生魚|沙拉/, 'fish'],
    [/茶|奶|飲|咖啡|手沖|美式|拿鐵|豆漿|汁|可可|酒|啤|氣泡|蘇打|冰沙|冰美|養樂多|牛奶|果汁|檸檬|愛玉|青草|仙草|蜜|珍珠/, 'drink'],
    [/冰|豆花|芋圓|麻糬|甜|布丁|糖|巧克力|蛋糕|泡芙|奶酥|塔|慕斯|圓|芋|紅豆|綠豆|花生|杏仁|桂花|條頭|紅龜|鳳梨|芒果|西瓜|水果|香蕉|蘋果|葡萄|草莓|芭樂/, 'sweet'],
    [/蛋|吐司|三明治|漢堡|培根|火腿|蛋餅|土司|鬆餅|早餐|煎|貝果|可頌/, 'brek'],
    [/滷|串|烤|燒|炙|沙嗲|熱狗|香腸|臭豆腐|米血|豆干|油豆腐|黑輪|關東煮|甜不辣|鴨血|杏鮑菇|玉米|地瓜/, 'grill']
  ];

  var SHOP_SUFFIX = /(店|行|館|坊|屋|舖|社|堂|室|廳|局|所|園|院|場|莊|號|樓|閣|軒|齋|苑|中心|公司|工廠|商行|批發|專賣|旅社|百貨|超商|攤|鋪|站|宮|廟|寺|處|部|署|學|校|科|藥|銀樓|旅館|酒場|酒店|食堂|麵|冰|鍋|茶|咖啡)$/;

  function fmtGBP(n) {
    var v = n / 30;
    if (v < 0.4) v = 0.4;
    if (v < 10) v = Math.round(v * 10) / 10;
    else if (v < 100) v = Math.round(v * 2) / 2;
    else v = Math.round(v / 5) * 5;
    return '£' + (v >= 10 ? (v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)) : v.toFixed(2));
  }

  function fakePhone(s) { return '020 7946 0' + String(100 + hash(s) % 900); }

  function categorize(zh) {
    for (var i = 0; i < RULES.length; i++) if (RULES[i][0].test(zh)) return RULES[i][1];
    return null;
  }
  function itemCategory(zh) {
    for (var i = 0; i < ITEM_RULES.length; i++) if (ITEM_RULES[i][0].test(zh)) return ITEM_RULES[i][1];
    return 'other';
  }

  var STATIONS = [['板橋', 'Wallington'], ['民生社區', 'Beddington'], ['市政府', 'Civic Centre'], ['市府', 'Sutton Town'], ['劍潭', 'Carshalton'], ['松山機場', 'Purley Way'], ['動物園', 'Wandle Park'], ['南港展覽館', 'Mitcham Junction'], ['芝山', 'Beddington Lane'], ['天母', 'Hackbridge'], ['捷運站', 'Station'], ['火車站', 'Station']];

  function translateStation(zh) {
    for (var i = 0; i < STATIONS.length; i++) if (zh.indexOf(STATIONS[i][0]) >= 0) return STATIONS[i][1];
    return null;
  }

  var cache = Object.create(null);

  function latinFix(s) {
    return s
      .replace(/TAIPEI CITY BUS/g, 'HACKBRIDGE BUS').replace(/Taipei City/g, 'Hackbridge').replace(/TAIPEI/g, 'HACKBRIDGE').replace(/Taipei/g, 'Hackbridge')
      .replace(/TAIWAN/g, 'BRITAIN').replace(/Taiwanese/g, 'British').replace(/Taiwan/g, 'Britain')
      .replace(/Keelung River/g, 'River Wandle').replace(/Keelung/g, 'Wandle').replace(/Tamsui/g, 'Beddington').replace(/Xinyi/g, 'Sutton').replace(/Zhongshan/g, 'Mitcham')
      .replace(/Longshan/g, 'Carshalton').replace(/Shilin/g, 'Wallington').replace(/Ximending/g, 'The Parade').replace(/Ximen/g, 'The Parade').replace(/Dadaocheng/g, 'Wandle Side')
      .replace(/Songshan/g, 'Purley').replace(/Wanhua/g, 'Hackbridge').replace(/Datong/g, 'Beddington').replace(/Zhongzheng/g, 'Central').replace(/Beitou/g, 'Roundshaw').replace(/Neihu/g, 'Mitcham Common').replace(/Nangang/g, 'Mitcham Junction').replace(/Da'an|Daan/g, 'Carshalton Beeches');
  }

  function translateCore(zh) {
    // zh: a string known to contain CJK
    if (EXACT[zh] != null) return EXACT[zh];
    var t = zh.trim();
    if (EXACT[t] != null) return EXACT[t];

    // bus route e.g. 紅30 天母 / 綠1 / 小18 芝山 / 棕9
    var m = t.match(/^(紅|藍|綠|棕|橘|黃|小|幹線|快)?\s*(\d{1,3})\s*([東西南北])?\s*(.*)$/);
    if (m && /^[紅藍綠棕橘黃小幹快]/.test(t)) {
      var dest = m[4] ? (translateStation(m[4]) || translateCore(m[4])) : '';
      return m[2] + (m[3] ? ({ '東': 'E', '西': 'W', '南': 'S', '北': 'N' })[m[3]] : '') + (dest ? ' ' + dest : '');
    }
    var mm = t.match(/^0?(\d)([東西南北])$/); if (mm) return mm[1];

    // "往 X" destination boards
    var w = t.match(/^往\s*(.+)$/);
    if (w) { return 'To ' + (translateStation(w[1]) || translateCore(w[1])); }
    if (/^下一站/.test(t)) return 'NEXT STATION';
    var st = translateStation(t); if (st && t.length <= 6) return st;

    // minutes: "2 分" style
    var mins = t.match(/^(\d+)\s*分$/); if (mins) return mins[1] + ' min';

    // split lines
    if (t.indexOf('\n') >= 0) return t.split('\n').map(function (l) { return CJK.test(l) ? translateCore(l) : latinFix(l); }).join('\n');

    // bilingual: Latin run with real words -> keep the Latin side
    var latin = t.replace(CJK_G, ' ').replace(/[·・•]/g, ' ').replace(/\s+/g, ' ').trim();
    var words = latin.match(/[A-Za-z]{3,}/g);
    var noDigits = latin.replace(/[\d\s().,:/+\-#&']/g, '');
    if (words && words.length && !KEEP_LATIN.test(latin) && /[A-Za-z]{4,}/.test(latin) && noDigits.length >= 4) {
      return latinFix(latin);
    }

    // priced item: "<name> <number>" / "<name> 每串 30"
    var pr = t.match(/(\d+(?:\.\d+)?)\s*(?:元|\/\S+)?\s*$/);
    var body = t.replace(CJK_G, function (x) { return x; });
    var phone = t.match(/\(?0\d\)?\s*\d{3,4}-?\d{4}/);
    var cat = categorize(t);
    if (phone) { var b0 = t.replace(phone[0], '').trim(); var base = b0 ? translateCore(b0) : ''; return (base ? base + ' · ' : '') + fakePhone(t); }

    if (pr && (!cat || cat === 'chinese' || cat === 'caff' || cat === 'chicken' || cat === 'chippy' || cat === 'kebab' || cat === 'boba' || cat === 'coffee' || cat === 'bakery' || cat === 'icecream' || cat === 'sweets')) {
      var ic = itemCategory(t);
      return pick(M[ic], t) + ' ' + fmtGBP(parseFloat(pr[1]));
    }
    if (pr && cat) { return pick(P[cat] || P.generic, t) + ' ' + fmtGBP(parseFloat(pr[1])); }

    // discount like "8 折"
    var dc = t.match(/(\d)\s*折/); if (dc) { return Math.max(5, 100 - Number(dc[1]) * 10) + '% OFF'; }

    if (cat === 'POLICE') return 'POLICE';
    if (cat) {
      var short = t.replace(/\s/g, '');
      var isItem = !SHOP_SUFFIX.test(short) && short.length <= 4 && /chinese|caff|chicken|chippy|kebab|boba|coffee|bakery|icecream|sweets/.test(cat);
      if (isItem) return pick(M[itemCategory(t)], t);
      return pick(P[cat] || P.generic, t);
    }
    // nothing matched
    var plain = t.replace(/\s/g, '');
    if (/[，。！？、…～：；「」『』（）]/.test(plain) || plain.length >= 7) return pick(P.slogan, t);
    var stripped = t.replace(CJK_G, '').replace(/[·・•|/\s]+/g, ' ').trim();
    if (stripped && /[A-Za-z0-9]/.test(stripped) && stripped.length > 2) return latinFix(stripped);
    return pick(P.generic, t);
  }

  function T(s) {
    if (typeof s !== 'string' || s.length === 0) return s;
    if (!CJK.test(s)) { return LATIN_BAD.test(s) ? latinFix(s) : s; }
    var c = cache[s]; if (c !== undefined) return c;
    var out;
    try { out = translateCore(s); } catch (e) { out = 'SM6'; }
    out = latinFix(out).replace(CJK_G, '').replace(/\s{2,}/g, ' ');
    if (!out.trim()) out = 'SM6';
    cache[s] = out; return out;
  }

  /* vertical signs: letters stacked */
  function vert(s) {
    var t = T(s).toUpperCase().replace(/[^A-Z0-9£&]/g, ' ').trim().split(/\s+/)[0] || 'SM6';
    if (t.length > 6) t = t.slice(0, 6);
    return Array.from(t);
  }

  /* ---------------- canvas patching ---------------- */
  function wrapCtx(proto) {
    if (!proto || proto.__hbw) return;
    ['fillText', 'strokeText', 'measureText'].forEach(function (name) {
      var o = proto[name]; if (!o) return;
      proto[name] = function (t) {
        if (typeof t === 'string' && (CJK.test(t) || LATIN_BAD.test(t))) { arguments[0] = T(t); }
        return o.apply(this, arguments);
      };
    });
    Object.defineProperty(proto, '__hbw', { value: 1 });
  }
  try { if (typeof CanvasRenderingContext2D !== 'undefined') wrapCtx(CanvasRenderingContext2D.prototype); } catch (e) { }
  try { if (typeof OffscreenCanvasRenderingContext2D !== 'undefined') wrapCtx(OffscreenCanvasRenderingContext2D.prototype); } catch (e) { }

  /* ---------------- debug dump (?hbdump) ---------------- */
  var dump = null;
  try { if (g.location && /[?&]hbdump/.test(g.location.search || '')) dump = {}; } catch (e) { }
  if (dump) {
    var T0 = T;
    T = function (s) { var r = T0(s); if (typeof s === 'string' && CJK.test(s)) dump[s] = r; return r; };
    g.__hbDump = dump;
  }

  /* ---------------- DOM safety net (main thread only) ---------------- */
  function domInit() {
    if (typeof document === 'undefined' || !g.MutationObserver) return;
    var ATTRS = ['title', 'aria-label', 'placeholder', 'alt'];
    function fixNode(n) {
      if (n.nodeType === 3) {
        var v = n.nodeValue; if (v && (CJK.test(v) || LATIN_BAD.test(v))) { var r = T(v); if (r !== v) n.nodeValue = r; }
      } else if (n.nodeType === 1) {
        var tag = n.tagName; if (tag === 'SCRIPT' || tag === 'STYLE') return;
        for (var i = 0; i < ATTRS.length; i++) { var a = n.getAttribute && n.getAttribute(ATTRS[i]); if (a && (CJK.test(a) || LATIN_BAD.test(a))) n.setAttribute(ATTRS[i], T(a)); }
        for (var c = n.firstChild; c; c = c.nextSibling) fixNode(c);
      }
    }
    var pending = false, queue = [];
    function flush() { pending = false; var q = queue; queue = []; for (var i = 0; i < q.length; i++) { try { fixNode(q[i]); } catch (e) { } } }
    var mo = new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        if (m.type === 'characterData') queue.push(m.target);
        else if (m.type === 'attributes') queue.push(m.target);
        else for (var j = 0; j < m.addedNodes.length; j++) queue.push(m.addedNodes[j]);
      }
      if (!pending) { pending = true; (g.requestAnimationFrame || setTimeout)(flush); }
    });
    function start() {
      if (!document.documentElement) return;
      fixNode(document.documentElement);
      mo.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
      if (document.title && (CJK.test(document.title) || LATIN_BAD.test(document.title))) document.title = T(document.title);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  }
  try { domInit(); } catch (e) { }

  g.__hbText = { T: function (s) { return T(s); }, vert: vert, CJK: CJK, fmtGBP: fmtGBP };
  g.hbVert = vert;
  g.hbT = function (s) { return T(s); };
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this));
