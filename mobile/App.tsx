import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, FlatList, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, Provider as PaperProvider } from 'react-native-paper';

type Product = {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  imageURL: string;
  promotion?: { enabled: boolean; entryFee: number; prize: string; prizeImageURL?: string };
};

type Cart = Product & { quantity: number };

// Expo replaces EXPO_PUBLIC_ variables in the web bundle during export.
// @ts-expect-error Expo's generated env type does not include project variables.
const API = process.env.EXPO_PUBLIC_API_URL || 'https://market-ecommerce.onrender.com/api';

const featured: Product[] = [
  {
    _id: '1',
    name: 'Cloud Runner',
    description: 'Featherlight runners made for everyday motion and elevated comfort.',
    category: 'Sneakers',
    price: 3499,
    stock: 18,
    imageURL: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
  },
  {
    _id: '2',
    name: 'Everyday Carry',
    description: 'A refined commuter carryall designed with soft structure and utility.',
    category: 'Accessories',
    price: 1899,
    stock: 12,
    imageURL: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',
  },
  {
    _id: '3',
    name: 'Studio Headphones',
    description: 'Premium wireless sound with warm detail and a luxurious finish.',
    category: 'Electronics',
    price: 5999,
    stock: 7,
    imageURL: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
  },
  {
    _id: '4',
    name: 'Sea Salt Crackers',
    description: 'Light, crisp crackers with a clean sea-salt finish for easy snacking.',
    category: 'Snacks',
    price: 249,
    stock: 32,
    imageURL: 'https://images.unsplash.com/photo-1621939514649-280e2aa2a2f3?auto=format&fit=crop&w=900&q=80',
  },
  {
    _id: '5',
    name: 'Herb & Seed Crackers',
    description: 'Toasty seeded crackers with fragrant herbs and a satisfying crunch.',
    category: 'Snacks',
    price: 299,
    stock: 24,
    imageURL: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=900&q=80',
  },
  {
    _id: '6',
    name: 'Chocolate Crunch Bites',
    description: 'Small-batch chocolate bites made for a rich, crisp afternoon pause.',
    category: 'Snacks',
    price: 399,
    stock: 16,
    imageURL: 'https://images.unsplash.com/photo-1548907040-4d42fcaa1f7a?auto=format&fit=crop&w=900&q=80',
  },
  {
    _id: '7',
    name: 'Shiva Kasi crackers pack',
    description: 'A festive family pack for bright Diwali celebrations and joyful evenings.',
    category: 'Diwali Crackers',
    price: 1499,
    stock: 20,
    promotion: { enabled: true, entryFee: 399, prize: 'iPhone', prizeImageURL: 'https://images.unsplash.com/photo-1592286927505-2fd9f07e72b8?auto=format&fit=crop&w=700&q=85' },
    imageURL: 'https://images.unsplash.com/photo-1533230408708-8f9f91d1235a?auto=format&fit=crop&w=900&q=80',
  },
];

const categories = ['All', 'Sneakers', 'Accessories', 'Electronics', 'Snacks', 'Diwali Crackers'];
type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

type StoreOrder = {
  id: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  promotion?: { prize: string; entryFee: number; prizeImageURL?: string };
  items: Array<{ productId: string; name: string; price: number; quantity: number; imageURL: string }>;
};

const formatPrice = (value: number) => `₹${value.toLocaleString('en-IN')}`;
const randomPlatformDiscountRate = () => Math.floor(Math.random() * 6) + 5;

const communityNodalPoints: Record<string, string[]> = {
  'My Home Avatar, Gachibowli': ['Gachibowli Stadium', 'DLF Cyber City', 'Biodiversity Junction'],
  'My Home Vihanga, Gachibowli': ['Gachibowli Flyover', 'Wipro Circle', 'ISB Road Junction'],
  'My Home Mangala, Kondapur': ['Kondapur RTO', 'Botanical Garden', 'Kothaguda Junction'],
  'Rajapushpa Provincia, Narsingi': ['Narsingi ORR Exit', 'Puppalaguda Junction', 'Khajaguda Hills'],
  'Rajapushpa Regalia, Kokapet': ['Kokapet ORR Exit', 'Neopolis Junction', 'Golden Mile Road'],
  'Aparna Sarovar, Nallagandla': ['Nallagandla Flyover', 'Lingampally Railway Station', 'Tellapur Road Junction'],
  'Aparna Zenon, Puppalaguda': ['Puppalaguda Main Road', 'Manikonda Market', 'Lanco Hills Circle'],
  'Financial District': ['Nanakramguda Circle', 'Waverock SEZ', 'Q-City Junction'],
  'HITEC City': ['Cyber Towers', 'Shilparamam', 'Raidurg Metro Station'],
  'Madhapur': ['Madhapur Police Station', 'Ayyappa Society', 'Durgam Cheruvu Metro Station'],
  'Kukatpally': ['KPHB Metro Station', 'JNTU Junction', 'Forum Sujana Mall'],
  'Miyapur': ['Miyapur Metro Station', 'Miyapur X Road', 'Madeenaguda Junction'],
  'Banjara Hills': ['GVK One Mall', 'Road No. 12 Junction', 'Basheerbagh Flyover'],
  'Jubilee Hills': ['Jubilee Check Post', 'Peddamma Temple', 'Film Nagar Road'],
  'Secunderabad': ['Secunderabad Railway Station', 'Paradise Circle', 'Tarnaka Junction'],
  'Uppal': ['Uppal Metro Station', 'Nagole Junction', 'Uppal Stadium'],
  'LB Nagar': ['LB Nagar Metro Station', 'Kothapet Fruit Market', 'Vanasthalipuram Junction'],
};
const communities = Object.keys(communityNodalPoints);

const createDemoOrder = (items: Cart[], totalOverride?: number, promotion?: Product['promotion']): StoreOrder => ({
  id: `ord_${Date.now()}`,
  status: 'pending',
  total: totalOverride ?? items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  createdAt: new Date().toISOString(),
  ...(promotion?.enabled ? { promotion: { prize: promotion.prize, entryFee: promotion.entryFee, prizeImageURL: promotion.prizeImageURL } } : {}),
  items: items.map((item) => ({
    productId: item._id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    imageURL: item.imageURL,
  })),
});

const AddToCartButton = ({ onPress }: { onPress: () => void }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Button compact mode="contained" onPress={press} buttonColor="#173f3a">
        Add to bag
      </Button>
    </Animated.View>
  );
};

const CartToast = ({ visible, itemName }: { visible: boolean; itemName: string }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 260 : 180,
      useNativeDriver: true,
    }).start();
  }, [progress, visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.cartToast,
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
        },
      ]}
    >
      <View style={styles.toastCheck}><Text style={styles.toastCheckText}>✓</Text></View>
      <View>
        <Text style={styles.toastTitle}>1 item added to cart</Text>
        <Text style={styles.toastSubtitle}>{itemName}</Text>
      </View>
    </Animated.View>
  );
};

const AnimatedPrizeImage = ({ uri, detail = false }: { uri?: string; detail?: boolean }) => {
  const motion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(motion, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(motion, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [motion]);

  return (
    <Animated.View style={[detail ? styles.detailPrizeFrame : styles.catalogPrizeFrame, { transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }] }]}>
      {uri ? <Image source={{ uri }} style={detail ? styles.detailPrizeImage : styles.catalogPrizeThumb} /> : <Text style={styles.prizeGiftFallback}>GIFT</Text>}
    </Animated.View>
  );
};

const ProductCard = ({ product, index, wide, onOpen, onAdd }: { product: Product; index: number; wide: boolean; onOpen: () => void; onAdd: () => void }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, delay: index * 70, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay: index * 70, friction: 8, tension: 55, useNativeDriver: true }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={[styles.productCard, wide && styles.productCardWide, { opacity, transform: [{ translateY }] }]}>
      <Pressable onPress={onOpen}>
        <Image source={{ uri: product.imageURL }} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text style={styles.itemTitle}>{product.name}</Text>
          <Text style={styles.itemMeta}>{product.category}</Text>
          <View style={styles.productFooter}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            <View style={styles.productActionStack}>
              {product.promotion?.enabled ? <Text style={styles.promotionPill}>+ {formatPrice(product.promotion.entryFee)} entry</Text> : null}
              {product.promotion?.enabled ? <AnimatedPrizeImage uri={product.promotion.prizeImageURL} /> : null}
              <AddToCartButton onPress={onAdd} />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const Shop = () => {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const [page, setPage] = useState<'home' | 'detail' | 'cart' | 'checkout' | 'seller' | 'auth' | 'orders'>('auth');
  const [products, setProducts] = useState(featured);
  const [selected, setSelected] = useState<Product>(featured[0]);
  const [cart, setCart] = useState<Cart[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [userName, setUserName] = useState('Guest');
  const [apiToken, setApiToken] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cartNotice, setCartNotice] = useState({ visible: false, itemName: '' });
  const [menuOpen, setMenuOpen] = useState(false);
  const [promotionOptIns, setPromotionOptIns] = useState<Record<string, boolean>>({});
  const [platformDiscountRate, setPlatformDiscountRate] = useState<number | null>(null);

  useEffect(() => {
    if (!API) return;
    fetch(`${API}/products`)
      .then((response) => response.ok ? response.json() : [])
      .then((data) => { if (Array.isArray(data) && data.length) setProducts(data); })
      .catch(() => undefined);
  }, []);

  const add = (p: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item._id === p._id);

      if (existing) {
        return current.map((item) =>
          item._id === p._id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [...current, { ...p, quantity: 1 }];
    });
    if (p.promotion?.enabled) {
      setPromotionOptIns((current) => ({ ...current, [p._id]: current[p._id] ?? true }));
      setPlatformDiscountRate((current) => current ?? randomPlatformDiscountRate());
    }
  };

  const showCartNotice = (product: Product) => {
    add(product);
    setCartNotice({ visible: true, itemName: product.name });
    setTimeout(() => setCartNotice((current) => ({ ...current, visible: false })), 2200);
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartPromotionFee = cart.reduce((sum, item) => item.promotion?.enabled && promotionOptIns[item._id] !== false ? sum + (Number(item.promotion.entryFee) || 399) : sum, 0);
  const hasPrizeItem = cart.some((item) => item.promotion?.enabled && promotionOptIns[item._id] !== false);
  const cartPlatformDiscount = hasPrizeItem && platformDiscountRate ? Math.round(total * platformDiscountRate / 100) : 0;
  const cartGrandTotal = total + cartPromotionFee - cartPlatformDiscount;

  useEffect(() => {
    if (!hasPrizeItem && platformDiscountRate !== null) setPlatformDiscountRate(null);
  }, [hasPrizeItem, platformDiscountRate]);
  const visibleProducts =
    activeCategory === 'All' ? products : products.filter((item) => item.category === activeCategory);

  const cancelOrder = (orderId: string) => {
    const targetOrder = orders.find((order) => order.id === orderId);
    if (!targetOrder) return;

    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status: 'cancelled' } : order)),
    );

    setProducts((current) =>
      current.map((product) => {
        const matchedItem = targetOrder.items.find((item) => item.productId === product._id);
        if (!matchedItem) return product;
        return { ...product, stock: product.stock + matchedItem.quantity };
      }),
    );
  };

  const addProduct = async (product: Product) => {
    let savedProduct = product;
    if (API && apiToken) {
      const { _id, ...payload } = product;
      const response = await fetch(`${API}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` }, body: JSON.stringify(payload) });
      if (!response.ok) return;
      savedProduct = await response.json();
    }
    setProducts((items) => [savedProduct, ...items]);
  };

  const updateProduct = async (product: Product) => {
    let savedProduct = product;
    if (API && apiToken && /^[a-f\d]{24}$/i.test(product._id)) {
      const { _id, ...payload } = product;
      const response = await fetch(`${API}/products/${_id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` }, body: JSON.stringify(payload) });
      if (!response.ok) return;
      savedProduct = await response.json();
    }
    setProducts((items) => items.map((item) => item._id === savedProduct._id ? savedProduct : item));
  };

  const removeProduct = async (productId: string) => {
    if (API && apiToken && /^[a-f\d]{24}$/i.test(productId)) {
      const response = await fetch(`${API}/products/${productId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${apiToken}` } });
      if (!response.ok) return;
    }
    setProducts((items) => items.filter((item) => item._id !== productId));
  };

  if (page === 'auth') {
    return (
      <Auth
        done={(value: 'buyer' | 'seller', name: string, token: string) => {
          setRole(value);
          setUserName(name);
          setApiToken(token);
          setPage(value === 'seller' ? 'seller' : 'home');
        }}
      />
    );
  }

  if (page === 'seller') {
    return (
      <Seller
        products={products}
        add={addProduct}
        update={updateProduct}
        remove={removeProduct}
        back={() => setPage('home')}
        go={setPage}
        userName={userName}
        cart={cart.length}
        orders={orders}
        role={role}
        token={apiToken}
      />
    );
  }

  if (page === 'orders') {
    return <OrdersScreen orders={orders} cart={cart.length} cancelOrder={cancelOrder} go={setPage} userName={userName} role={role} />;
  }

  if (page === 'checkout') {
    const promotionProduct = cart.find((item) => item.promotion?.enabled);
    const promotion = promotionProduct?.promotion;
    return (
      <Checkout
        total={total}
        promotion={promotion}
        promotionSelected={promotionProduct ? promotionOptIns[promotionProduct._id] === true : false}
        platformDiscountRate={platformDiscountRate}
        back={() => setPage('cart')}
        success={async (finalTotal: number, selectedPromotion: Product['promotion'], delivery: { address: string; city: string; state: string; pincode: string; contact: string; community: string; nodalPoint: string }) => {
          const response = await fetch(`${API}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` },
            body: JSON.stringify({
              items: cart.map((item) => ({ productId: item._id, quantity: item.quantity, prizeEntry: item.promotion?.enabled && promotionOptIns[item._id] !== false })),
              delivery: {
                address: `${delivery.address}, ${delivery.city}, ${delivery.state}, ${delivery.pincode}`,
                contact: /^\d{10}$/.test(delivery.contact.trim()) ? `+91${delivery.contact.trim()}` : delivery.contact.trim(),
                community: delivery.community,
                nodalPoint: delivery.nodalPoint,
              },
              paymentResult: 'success',
            }),
          });
          if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Unable to place order' }));
            Alert.alert('Order failed', error.message || 'Unable to place order');
            return false;
          }
          const savedOrder = await response.json();
          const newOrder = createDemoOrder(cart, finalTotal, selectedPromotion);
          newOrder.id = String(savedOrder._id || newOrder.id);
          newOrder.total = savedOrder.total;
          setOrders((current) => [newOrder, ...current]);
          setProducts((current) =>
            current.map((product) => {
              const item = cart.find((entry) => entry._id === product._id);
              if (!item) return product;
              return { ...product, stock: Math.max(0, product.stock - item.quantity) };
            }),
          );
          setCart([]);
          setPage('orders');
          return true;
        }}
      />
    );
  }

  if (page === 'cart') {
    return (
      <SafeAreaView style={styles.page}>
        <Header cart={cart.length} go={setPage} userName={userName} role={role} />
        <View style={[styles.contentWrap, isWide && styles.wideContentWrap]}>
          <CartToast visible={cartNotice.visible} itemName={cartNotice.itemName} />
          <Text style={styles.pageTitle}>Your bag</Text>
          <FlatList
            data={cart}
            keyExtractor={(item) => item._id}
            contentContainerStyle={cart.length === 0 ? styles.emptyList : styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyState}>Your bag is waiting for a find.</Text>}
            renderItem={({ item }) => (
              <View style={styles.cartItemCard}>
                <Image source={{ uri: item.imageURL }} style={styles.cartThumb} />
                <View style={styles.cartItemMeta}>
                  <Text style={styles.itemTitle}>{item.name}</Text>
                  <Text style={styles.itemMeta}>{formatPrice(item.price)} × {item.quantity}</Text>
                  <Pressable onPress={() => setCart((current) => current.filter((entry) => entry._id !== item._id))}>
                    <Text style={styles.inlineAction}>Remove</Text>
                  </Pressable>
                </View>
                {item.promotion?.enabled && <View style={styles.cartPromotionStack}><AnimatedPrizeImage uri={item.promotion.prizeImageURL} /><Pressable style={styles.cartPromotionToggle} onPress={() => setPromotionOptIns((current) => ({ ...current, [item._id]: !current[item._id] }))}><View style={[styles.cartCheck, promotionOptIns[item._id] !== false && styles.cartCheckActive]}><Text style={styles.cartCheckText}>{promotionOptIns[item._id] !== false ? '✓' : ''}</Text></View><Text style={styles.cartPromotionText}>{promotionOptIns[item._id] !== false ? 'Prize added' : 'Add entry'}</Text></Pressable></View>}
              </View>
            )}
          />
          {cart.length > 0 && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Order total</Text>
              {cartPlatformDiscount > 0 && <View style={styles.checkoutLine}><Text style={styles.muted}>Platform discount ({platformDiscountRate}%)</Text><Text style={styles.checkoutLineValue}>- {formatPrice(cartPlatformDiscount)}</Text></View>}
              {cartPromotionFee > 0 && <View style={styles.checkoutLine}><Text style={styles.muted}>Bonus entry</Text><Text style={styles.checkoutLineValue}>+ {formatPrice(cartPromotionFee)}</Text></View>}
              <Text style={styles.summaryTotal}>{formatPrice(cartGrandTotal)}</Text>
              <Button mode="contained" onPress={() => setPage('checkout')} buttonColor="#173f3a">
                Continue to checkout
              </Button>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (page === 'detail') {
    return (
      <SafeAreaView style={styles.page}>
        <Header cart={cart.length} go={setPage} userName={userName} role={role} />
        <ScrollView contentContainerStyle={[styles.detailScroll, isWide && styles.wideDetailScroll]}>
          <CartToast visible={cartNotice.visible} itemName={cartNotice.itemName} />
          <Image source={{ uri: selected.imageURL }} style={styles.heroImage} />
          <View style={[styles.detailContent, isWide && styles.wideDetailContent]}>
            <View style={styles.detailPillRow}>
              <Chip style={styles.softChip}>{selected.category}</Chip>
              <Chip style={styles.softChip}>4.9 rating</Chip>
            </View>
            <Text style={styles.pageTitle}>{selected.name}</Text>
            <Text style={styles.priceLarge}>{formatPrice(selected.price)}</Text>
            <Text style={styles.description}>{selected.description}</Text>
            {selected.promotion?.enabled && <Pressable style={styles.detailPromotionCard} onPress={() => setPromotionOptIns((current) => ({ ...current, [selected._id]: !current[selected._id] }))}><AnimatedPrizeImage uri={selected.promotion.prizeImageURL} detail /><View style={styles.detailPromotionCopy}><Text style={styles.promotionEyebrow}>OPTIONAL BONUS ENTRY</Text><Text style={styles.detailPromotionTitle}>Add {formatPrice(selected.promotion.entryFee)} for a chance to win an {selected.promotion.prize}</Text><Text style={styles.muted}>Choose this at checkout. Entry is never added automatically.</Text></View><View style={styles.detailPromotionToggle}><View style={[styles.promotionCheck, promotionOptIns[selected._id] && styles.promotionCheckActive]}><Text style={styles.promotionCheckText}>{promotionOptIns[selected._id] ? '✓' : ''}</Text></View><Text style={styles.detailPromotionToggleText}>{promotionOptIns[selected._id] ? 'Added' : 'Add entry'}</Text></View></Pressable>}
            <View style={styles.metaRow}>
              <Text style={styles.metaBadge}>Free delivery</Text>
              <Text style={styles.muted}>{selected.stock} left in stock</Text>
            </View>
            <Button mode="contained" onPress={() => showCartNotice(selected)} buttonColor="#173f3a">
              Add to bag
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.announcementBar}>
        <Text style={styles.announcementText}>FREE DELIVERY ON ORDERS ABOVE ₹999</Text>
      </View>
      <Header cart={cart.length} go={setPage} userName={userName} role={role} wide={isWide} onMenu={() => setMenuOpen(true)} />
      {menuOpen && (
        <View style={styles.menuLayer}>
          <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)} />
          <View style={styles.menuPanel}>
            <View style={styles.menuPanelHeader}>
              <Text style={styles.menuBrand}>BROWSE</Text>
              <Pressable onPress={() => setMenuOpen(false)}><Text style={styles.menuClose}>Close</Text></Pressable>
            </View>
            <Text style={styles.menuEyebrow}>EXPLORE THE STORE</Text>
            {categories.map((category) => (
              <Pressable
                key={category}
                style={styles.menuItem}
                onPress={() => {
                  setActiveCategory(category);
                  setMenuOpen(false);
                }}
              >
                <Text style={styles.menuItemText}>{category === 'All' ? 'Shop all' : category}</Text>
                <Text style={styles.menuArrow}>+</Text>
              </Pressable>
            ))}
            <View style={styles.menuDivider} />
            {role === 'buyer' && <Pressable style={styles.menuItem} onPress={() => { setPage('orders'); setMenuOpen(false); }}>
              <Text style={styles.menuItemText}>Orders</Text><Text style={styles.menuArrow}>+</Text>
            </Pressable>}
            {role === 'seller' && (
              <Pressable style={styles.menuItem} onPress={() => { setPage('seller'); setMenuOpen(false); }}>
                <Text style={styles.menuItemText}>Seller studio</Text><Text style={styles.menuArrow}>+</Text>
              </Pressable>
            )}
            {role === 'buyer' && <Pressable style={styles.menuItem} onPress={() => { setPage('cart'); setMenuOpen(false); }}>
              <Text style={styles.menuItemText}>Bag ({cart.length})</Text><Text style={styles.menuArrow}>+</Text>
            </Pressable>}
          </View>
        </View>
      )}
      <CartToast visible={cartNotice.visible} itemName={cartNotice.itemName} />
      <FlatList
        data={visibleProducts}
        numColumns={isWide ? 2 : 1}
        columnWrapperStyle={isWide ? styles.gridRow : undefined}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, isWide && styles.wideListContent]}
        ListHeaderComponent={
          <>
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85' }}
              style={styles.heroSection}
              imageStyle={styles.homeHeroImage}
            />
            <View style={styles.categoryShelf}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, styles.categorySectionTitle]}>Shop categories</Text>
                <Text style={styles.categoryHint}>CURATED</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsWrap}>
                {categories.map((item) => {
                  const active = activeCategory === item;
                  return (
                    <Chip
                      key={item}
                      onPress={() => setActiveCategory(item)}
                      mode={active ? 'flat' : 'outlined'}
                      selected={active}
                      showSelectedCheck={false}
                      style={[styles.categoryChip, active && styles.categoryChipActive]}
                      textStyle={active ? styles.categoryChipTextActive : styles.categoryChipText}
                    >
                      {item}
                    </Chip>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending now</Text>
              <Text style={styles.sectionLink}>Discover more</Text>
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <ProductCard
            product={item}
            index={index}
            wide={isWide}
            onOpen={() => {
              setSelected(item);
              setPage('detail');
            }}
            onAdd={() => showCartNotice(item)}
          />
        )}
        ListFooterComponent={
          <View style={[styles.promoStrip, isWide && styles.widePromoStrip]}>
            <View style={styles.promoCopy}>
              <Text style={styles.promoEyebrow}>A LITTLE EXTRA</Text>
              <Text style={styles.promoTitle}>Make room for something good.</Text>
              <Text style={styles.promoDescription}>Fresh snacks and useful upgrades, selected for easy everyday living.</Text>
            </View>
            <Button mode="outlined" onPress={() => setActiveCategory('Snacks')} textColor="#16745a">
              Browse snacks
            </Button>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const Header = ({ cart, go, userName, role, wide, onMenu, seller }: any) => {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <View style={styles.headerWrap}>
      <LinearGradient colors={['#263630', '#14221f']} style={[styles.header, wide && styles.wideHeader]}>
        <Text style={styles.logo}>BROWSE</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={onMenu || (() => go('home'))} style={styles.menuButton}>
            <Text style={styles.menuButtonLines}>|||</Text>
            <Text style={styles.nav}>Menu</Text>
          </Pressable>
          {role === 'buyer' && <Pressable onPress={() => go('cart')} style={styles.bagBadgeWrap}>
            <Text style={styles.nav}>Bag</Text>
            <View style={styles.bagBadge}><Text style={styles.bagBadgeText}>{cart}</Text></View>
          </Pressable>}
          <Pressable
            accessibilityLabel="Open user menu"
            onPress={() => setProfileOpen((current) => !current)}
            style={styles.profileButton}
          >
            <Text style={styles.profileIcon}>{String(userName || 'Guest').trim().charAt(0).toUpperCase() || 'G'}</Text>
          </Pressable>
          {profileOpen && (
            <View style={styles.profileMenu}>
              <Text style={styles.profileEyebrow}>YOUR ACCOUNT</Text>
              <Text style={styles.profileTitle}>{userName}</Text>
              {role === 'buyer' && <Pressable style={styles.profileMenuItem} onPress={() => { go('orders'); setProfileOpen(false); }}>
                <Text style={styles.profileMenuText}>Your orders</Text>
                <Text style={styles.profileMenuArrow}>+</Text>
              </Pressable>}
              {role === 'seller' && (
                <Pressable style={styles.profileMenuItem} onPress={() => { go('seller'); setProfileOpen(false); }}>
                  <Text style={styles.profileMenuText}>{seller ? 'Seller studio' : 'Seller studio'}</Text>
                  <Text style={styles.profileMenuArrow}>+</Text>
                </Pressable>
              )}
              <View style={styles.profileDivider} />
              <Pressable style={styles.profileMenuItem} onPress={() => { go('auth'); setProfileOpen(false); }}>
                <Text style={styles.profileLogout}>Log out</Text>
                <Text style={styles.profileMenuArrow}>+</Text>
              </Pressable>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const OrdersScreen = ({ orders, cart, cancelOrder, go, userName, role }: { orders: StoreOrder[]; cart: number; cancelOrder: (id: string) => void; go: (page: 'home' | 'detail' | 'cart' | 'checkout' | 'seller' | 'auth' | 'orders') => void; userName: string; role: 'buyer' | 'seller'; }) => (
  <SafeAreaView style={styles.page}>
    <Header cart={cart} go={go} userName={userName} role={role} />
    <View style={styles.contentWrap}>
      <View style={styles.sectionHeader}>
        <Text style={styles.pageTitle}>My orders</Text>
        <Text style={styles.sectionLink}>{orders.filter((order) => order.status !== 'cancelled').length} active</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => <OrderCard order={item} index={index} onCancel={cancelOrder} />}
      />
    </View>
  </SafeAreaView>
);

const OrderCard = ({ order, index, onCancel }: { order: StoreOrder; index: number; onCancel: (id: string) => void }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, delay: index * 80, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, [fade, translateY, index]);

  const statusColor = order.status === 'cancelled' ? '#b91c1c' : order.status === 'delivered' ? '#16745a' : order.status === 'confirmed' ? '#16745a' : '#b7791f';

  return (
    <Animated.View style={[styles.orderCard, { opacity: fade, transform: [{ translateY }] }]}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{order.id.replace('ord_', '')}</Text>
          <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: `${statusColor}20` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{order.status}</Text>
        </View>
      </View>

      {order.items.map((item) => (
        <View key={`${order.id}-${item.productId}`} style={styles.orderItemRow}>
          <Image source={{ uri: item.imageURL }} style={styles.orderThumb} />
          <View style={styles.orderItemMeta}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            <Text style={styles.itemMeta}>Qty {item.quantity}</Text>
          </View>
          <Text style={styles.price}>{formatPrice(item.price * item.quantity)}</Text>
        </View>
      ))}

      {order.promotion && (
        <View style={styles.orderPromotionRow}>
          <AnimatedPrizeImage uri={order.promotion.prizeImageURL} />
          <View style={styles.orderPromotionCopy}>
            <Text style={styles.orderPromotionLabel}>BONUS ENTRY</Text>
            <Text style={styles.itemTitle}>Chance to win an {order.promotion.prize}</Text>
            <Text style={styles.itemMeta}>Paid {formatPrice(order.promotion.entryFee)}</Text>
          </View>
        </View>
      )}

      <View style={styles.orderFooter}>
        <View><Text style={styles.orderTotalLabel}>Order total</Text><Text style={styles.orderTotal}>{formatPrice(order.total)}</Text></View>
        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <Button mode="contained" compact onPress={() => onCancel(order.id)} buttonColor="#173f3a">
            Cancel order
          </Button>
        )}
      </View>
    </Animated.View>
  );
};

const Auth = ({ done }: { done: (value: 'buyer' | 'seller', name: string, token: string) => void }) => {
  const { width, height } = useWindowDimensions();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [seller, setSeller] = useState(false);
  const [name, setName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formOpacity = useRef(new Animated.Value(1)).current;
  const formOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    formOpacity.setValue(0);
    formOffset.setValue(10);
    Animated.parallel([
      Animated.timing(formOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(formOffset, { toValue: 0, friction: 8, tension: 70, useNativeDriver: true }),
    ]).start();
  }, [formOffset, formOpacity, mode]);

  const submit = async () => {
    setMessage('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setMessage('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }
    if (mode === 'signup' && name.trim().length < 2) {
      setMessage('Enter your full name to create an account.');
      return;
    }
    const normalizedGst = gstNumber.trim().toUpperCase();
    if (mode === 'signup' && seller && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[A-Z0-9]$/.test(normalizedGst)) {
      setMessage('Enter a valid 15-character GSTIN to register as a seller.');
      return;
    }
    if (!API) {
      setMessage('Connect EXPO_PUBLIC_API_URL to validate your account.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API}/auth/${mode === 'signup' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          ...(mode === 'signup' ? { name: name.trim(), role: seller ? 'seller' : 'buyer', ...(seller ? { gstNumber: normalizedGst } : {}) } : {}),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to authenticate.');
      if (data.user.role !== (seller ? 'seller' : 'buyer')) {
        throw new Error(`This account is registered as ${data.user.role}. Choose the matching role.`);
      }
      done(data.user.role, data.user.name || name.trim() || normalizedEmail.split('@')[0], data.token);
    } catch (error) {
      const detail = error instanceof TypeError ? `Cannot reach the API at ${API}. Check that the server is running and EXPO_PUBLIC_API_URL is correct.` : error instanceof Error ? error.message : 'Unable to authenticate.';
      setMessage(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ImageBackground
      source={require('./assets/Background image.webp')}
      style={[styles.authBackground, { width, minHeight: height }]}
      imageStyle={styles.authBackgroundImage}
    >
      <LinearGradient colors={['rgba(8, 20, 17, 0.78)', 'rgba(8, 20, 17, 0.54)']} style={styles.authBackgroundOverlay}>
        <SafeAreaView style={[styles.page, styles.authPage, styles.center]}>
          <LinearGradient colors={['#fff8eb', '#e8dcc6']} style={styles.authCard}>
        <Text style={styles.pageTitle}>{mode === 'signin' ? (seller ? 'Seller portal' : 'Welcome back') : 'Create account'}</Text>
        <Text style={styles.muted}>A seamless storefront experience for your next order.</Text>

        <View style={styles.authToggleRow}>
          <Pressable
            onPress={() => setMode('signin')}
            style={[styles.authToggle, mode === 'signin' && styles.authToggleSignInActive]}
          >
            <Text style={[styles.authToggleText, mode === 'signin' && styles.authToggleSignInText]}>Sign in</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('signup')}
            style={[styles.authToggle, mode === 'signup' && styles.authToggleSignUpActive]}
          >
            <Text style={[styles.authToggleText, mode === 'signup' && styles.authToggleSignUpText]}>Sign up</Text>
          </Pressable>
        </View>

        <Animated.View style={{ opacity: formOpacity, transform: [{ translateY: formOffset }] }}>
          {mode === 'signup' && (
            <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
          )}
          {mode === 'signup' && seller && (
            <TextInput style={styles.input} placeholder="GSTIN (15 characters)" value={gstNumber} onChangeText={(value) => setGstNumber(value.toUpperCase())} autoCapitalize="characters" maxLength={15} />
          )}
          <TextInput style={styles.input} placeholder="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

          <View style={styles.roleRow}>
            <Pressable onPress={() => setSeller(false)} style={[styles.roleOption, !seller && styles.roleOptionActive]}>
              <Text style={[styles.roleOptionText, !seller && styles.roleOptionTextActive]}>Buyer</Text>
            </Pressable>
            <Pressable onPress={() => setSeller(true)} style={[styles.roleOption, seller && styles.roleOptionActive]}>
              <Text style={[styles.roleOptionText, seller && styles.roleOptionTextActive]}>Seller</Text>
            </Pressable>
          </View>

          <Button
            mode="contained"
            onPress={submit}
            loading={submitting}
            disabled={submitting}
            buttonColor="#173f3a"
            style={styles.primaryAuthAction}
          >
            {mode === 'signin' ? 'Continue' : 'Create account'}
          </Button>

          {message ? <Text style={styles.authError}>{message}</Text> : null}
        </Animated.View>

        <Button onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')} textColor="#16745a">
          {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </Button>
          </LinearGradient>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
};

const Checkout = ({ total, promotion, promotionSelected, platformDiscountRate, back, success }: any) => {
  const [step, setStep] = useState(1);
  const [includePromotion, setIncludePromotion] = useState(Boolean(promotionSelected));
  const [address, setAddress] = useState({ line: '', city: '', state: '', pincode: '', contact: '' });
  const [community, setCommunity] = useState(communities[0]);
  const [nodalPoint, setNodalPoint] = useState(communityNodalPoints[communities[0]][0]);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [nodalPointOpen, setNodalPointOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const nodalPoints = communityNodalPoints[community] || [];
  const promotionFee = includePromotion && promotion?.enabled ? Number(promotion.entryFee) || 399 : 0;
  const platformDiscount = includePromotion && platformDiscountRate ? Math.round(total * platformDiscountRate / 100) : 0;
  const finalTotal = total + promotionFee - platformDiscount;

  useEffect(() => {
    setNodalPoint(nodalPoints[0] || '');
  }, [community]);

  const continueToPayment = () => {
    const trimmedAddress = address.line.trim();
    const trimmedCity = address.city.trim();
    const trimmedState = address.state.trim();
    const trimmedPincode = address.pincode.trim();
    const trimmedContact = address.contact.trim();
    if (trimmedAddress.length < 10) return setValidationMessage('Enter a complete street address.');
    if (!/^[A-Za-z][A-Za-z .'-]{1,}$/.test(trimmedCity)) return setValidationMessage('Enter a valid city.');
    if (!/^[A-Za-z][A-Za-z .'-]{1,}$/.test(trimmedState)) return setValidationMessage('Enter a valid state.');
    if (!/^\d{6}$/.test(trimmedPincode)) return setValidationMessage('Enter a valid 6-digit pincode.');
    if (!/^(?:\+91[6-9]\d{9}|[6-9]\d{9})$/.test(trimmedContact)) return setValidationMessage('Enter a valid 10-digit Indian mobile number.');
    setValidationMessage('');
    setStep(2);
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.contentWrap}>
        <View style={styles.checkoutHeader}>
          <Button compact onPress={back} textColor="#16745a">Back to bag</Button>
          <Text style={styles.checkoutStep}>Step {step} of 2</Text>
        </View>
        <Text style={styles.pageTitle}>{step === 1 ? 'Delivery details' : 'Review and pay'}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
        </View>

        {step === 1 ? (
          <>
            <Text style={styles.fieldLabel}>Community</Text>
            <Pressable style={styles.dropdown} onPress={() => { setCommunityOpen((current) => !current); setNodalPointOpen(false); }}>
              <Text style={styles.dropdownText}>{community}</Text>
              <Text style={styles.dropdownArrow}>{communityOpen ? '▲' : '▼'}</Text>
            </Pressable>
            {communityOpen && <View style={styles.communityDropdownMenu}>
              {communities.map((option) => (
                <Pressable key={option} style={styles.dropdownOption} onPress={() => { setCommunity(option); setCommunityOpen(false); }}>
                  <Text style={styles.dropdownOptionText}>{option}</Text>
                </Pressable>
              ))}
            </View>}
            <Text style={styles.fieldLabel}>Nearby nodal point</Text>
            <Pressable style={styles.dropdown} onPress={() => { setNodalPointOpen((current) => !current); setCommunityOpen(false); }}>
              <Text style={styles.dropdownText}>{nodalPoint}</Text>
              <Text style={styles.dropdownArrow}>{nodalPointOpen ? '▲' : '▼'}</Text>
            </Pressable>
            {nodalPointOpen && <View style={styles.dropdownMenu}>
              {nodalPoints.map((option) => (
                <Pressable key={option} style={styles.dropdownOption} onPress={() => { setNodalPoint(option); setNodalPointOpen(false); }}>
                  <Text style={styles.dropdownOptionText}>{option}</Text>
                </Pressable>
              ))}
            </View>}
            <Text style={styles.fieldLabel}>Street address</Text>
            <TextInput style={styles.input} placeholder="House number, street, area" value={address.line} onChangeText={(line) => setAddress((current) => ({ ...current, line }))} />
            <View style={styles.inlineFields}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>City</Text>
                <TextInput style={styles.input} placeholder="City" value={address.city} onChangeText={(city) => setAddress((current) => ({ ...current, city }))} />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>State</Text>
                <TextInput style={styles.input} placeholder="State" value={address.state} onChangeText={(state) => setAddress((current) => ({ ...current, state }))} />
              </View>
            </View>
            <View style={styles.inlineFields}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Pincode</Text>
                <TextInput style={styles.input} placeholder="6-digit pincode" value={address.pincode} onChangeText={(pincode) => setAddress((current) => ({ ...current, pincode }))} keyboardType="number-pad" maxLength={6} />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Contact number</Text>
                <TextInput style={styles.input} placeholder="Mobile number" value={address.contact} onChangeText={(contact) => setAddress((current) => ({ ...current, contact }))} keyboardType="phone-pad" />
              </View>
            </View>
            <View style={styles.checkoutActions}>
              <Button mode="contained" onPress={continueToPayment} buttonColor="#173f3a">
                Continue to payment
              </Button>
            </View>
            {validationMessage ? <Text style={styles.validationMessage}>{validationMessage}</Text> : null}
          </>
        ) : (
          <>
            {promotion?.enabled && (
              <Pressable style={styles.promotionCard} onPress={() => setIncludePromotion((current) => !current)}>
                <View style={[styles.promotionCheck, includePromotion && styles.promotionCheckActive]}>
                  <Text style={styles.promotionCheckText}>{includePromotion ? '✓' : ''}</Text>
                </View>
                <AnimatedPrizeImage uri={promotion.prizeImageURL} />
                <View style={styles.promotionCopy}>
                  <Text style={styles.promotionEyebrow}>DIWALI BONUS ENTRY</Text>
                  <Text style={styles.promotionTitle}>Add {formatPrice(promotion.entryFee)} for a chance to win an {promotion.prize}</Text>
                  <Text style={styles.promotionNote}>Optional promotional entry. Terms and winner selection apply.</Text>
                </View>
              </Pressable>
            )}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Payment</Text>
              <View style={styles.checkoutLine}><Text style={styles.muted}>Community</Text><Text style={styles.checkoutLineValue}>{community}</Text></View>
              <View style={styles.checkoutLine}><Text style={styles.muted}>Nodal point</Text><Text style={styles.checkoutLineValue}>{nodalPoint}</Text></View>
              <View style={styles.checkoutLine}><Text style={styles.muted}>Products</Text><Text style={styles.checkoutLineValue}>{formatPrice(total)}</Text></View>
              {platformDiscount > 0 && <View style={styles.checkoutLine}><Text style={styles.muted}>Platform discount ({platformDiscountRate}%)</Text><Text style={styles.checkoutLineValue}>- {formatPrice(platformDiscount)}</Text></View>}
              {promotionFee > 0 && <View style={styles.checkoutLine}><Text style={styles.muted}>Bonus entry</Text><Text style={styles.checkoutLineValue}>+ {formatPrice(promotionFee)}</Text></View>}
              <View style={styles.checkoutDivider} />
              <Text style={styles.summaryTotal}>{formatPrice(finalTotal)}</Text>
              <Text style={styles.muted}>Dummy payment · secure checkout</Text>
            </View>
            <Button
              mode="contained"
              onPress={async () => {
                const completed = await success(finalTotal, includePromotion ? promotion : undefined, { ...address, community, nodalPoint });
                if (completed) Alert.alert('Payment successful', 'Your order is confirmed. ETA: 3-5 business days');
              }}
              buttonColor="#173f3a"
            >
              Pay now
            </Button>
            <Button onPress={() => setStep(1)} textColor="#16745a">
              Edit delivery details
            </Button>
            <Button onPress={() => Alert.alert('Payment failed', 'Mock failure flow — no charge was made.')} textColor="#b91c1c">
              Try failure flow
            </Button>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const Seller = ({ products, add, update, remove, back, go, userName, cart, orders }: any) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('999');
  const [stock, setStock] = useState('5');
  const [category, setCategory] = useState('Sneakers');
  const [promotionEnabled, setPromotionEnabled] = useState(false);
  const [promotionFee, setPromotionFee] = useState('399');
  const [promotionPrize, setPromotionPrize] = useState('iPhone');
  const [promotionPrizeImageURL, setPromotionPrizeImageURL] = useState('');
  const [imageURL, setImageURL] = useState(featured[0].imageURL);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [sellerSection, setSellerSection] = useState<'overview' | 'catalog' | 'orders'>('catalog');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      setImageURL(asset.base64 ? `data:${mimeType};base64,${asset.base64}` : asset.uri);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('999');
    setStock('5');
    setCategory('Sneakers');
    setPromotionEnabled(false);
    setPromotionFee('399');
    setPromotionPrize('iPhone');
    setPromotionPrizeImageURL('');
    setImageURL(featured[0].imageURL);
    setEditingId(null);
  };

  const editProduct = (product: Product) => {
    setEditingId(product._id);
    setName(product.name);
    setDescription(product.description);
    setPrice(String(product.price));
    setStock(String(product.stock));
    setCategory(product.category);
    setPromotionEnabled(Boolean(product.promotion?.enabled));
    setPromotionFee(String(product.promotion?.entryFee || 399));
    setPromotionPrize(product.promotion?.prize || 'iPhone');
    setPromotionPrizeImageURL(product.promotion?.prizeImageURL || '');
    setImageURL(product.imageURL);
  };

  const deleteProduct = (product: Product) => {
    setPendingDeleteId(product._id);
  };

  const pickPromotionImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      setPromotionPrizeImageURL(asset.base64 ? `data:${mimeType};base64,${asset.base64}` : asset.uri);
    }
  };

  const totalStock = products.reduce((sum: number, product: Product) => sum + product.stock, 0);
  const lowStock = products.filter((product: Product) => product.stock <= 5).length;
  const activeOrders = orders.filter((order: StoreOrder) => !['cancelled', 'delivered'].includes(order.status)).length;
  const totalSales = orders.filter((order: StoreOrder) => order.status !== 'cancelled').length;
  const totalRevenue = orders.filter((order: StoreOrder) => order.status !== 'cancelled').reduce((sum: number, order: StoreOrder) => sum + order.total, 0);
  const totalRefunds = orders.filter((order: StoreOrder) => order.status === 'cancelled').reduce((sum: number, order: StoreOrder) => sum + order.total, 0);
  const salesSeries = orders.filter((order: StoreOrder) => order.status !== 'cancelled').slice(-6);
  const chartMax = Math.max(...salesSeries.map((order: StoreOrder) => order.total), 1);

  return (
    <SafeAreaView style={styles.page}>
      <Header cart={cart} go={go} userName={userName} role="seller" seller />
      <ScrollView contentContainerStyle={styles.sellerScrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sellerIntro}>
          <Text style={styles.sellerEyebrow}>SELLER STUDIO</Text>
          <Text style={styles.sellerTitle}>Run your collection.</Text>
          <Text style={styles.muted}>Catalog, stock, and order signals in one place.</Text>
        </View>

        <View style={styles.sellerTabs}>
          {(['overview', 'catalog', 'orders'] as const).map((section) => (
            <Pressable key={section} onPress={() => setSellerSection(section)} style={[styles.sellerTab, sellerSection === section && styles.sellerTabActive]}>
              <Text style={[styles.sellerTabText, sellerSection === section && styles.sellerTabTextActive]}>{section}</Text>
            </Pressable>
          ))}
        </View>

        {sellerSection === 'overview' && (
          <View style={styles.sellerMetricGrid}>
            <View style={styles.sellerMetricCard}><Text style={styles.sellerMetricLabel}>Products</Text><Text style={styles.sellerMetricValue}>{products.length}</Text></View>
            <View style={styles.sellerMetricCard}><Text style={styles.sellerMetricLabel}>Units in stock</Text><Text style={styles.sellerMetricValue}>{totalStock}</Text></View>
            <View style={styles.sellerMetricCard}><Text style={styles.sellerMetricLabel}>Low stock</Text><Text style={styles.sellerMetricValue}>{lowStock}</Text></View>
            <View style={styles.sellerMetricCard}><Text style={styles.sellerMetricLabel}>Active orders</Text><Text style={styles.sellerMetricValue}>{activeOrders}</Text></View>
            <View style={styles.sellerMetricCard}><Text style={styles.sellerMetricLabel}>Total sales</Text><Text style={styles.sellerMetricValue}>{totalSales}</Text></View>
            <View style={styles.sellerMetricCard}><Text style={styles.sellerMetricLabel}>Revenue received</Text><Text style={styles.sellerMetricValue}>{formatPrice(totalRevenue)}</Text></View>
            <View style={styles.sellerMetricCard}><Text style={styles.sellerMetricLabel}>Refunds</Text><Text style={styles.sellerMetricValue}>{formatPrice(totalRefunds)}</Text></View>
            <View style={styles.salesChartCard}>
              <View style={styles.salesChartHeader}>
                <View><Text style={styles.salesChartEyebrow}>PERFORMANCE</Text><Text style={styles.salesChartTitle}>Sales by order</Text></View>
                <Text style={styles.salesChartTotal}>{formatPrice(totalRevenue)}</Text>
              </View>
              {salesSeries.length === 0 ? <Text style={styles.muted}>Sales will appear here after your first order.</Text> : (
                <View style={styles.salesChart}>
                  {salesSeries.map((order: StoreOrder) => (
                    <View style={styles.salesBarColumn} key={order.id}>
                      <Text style={styles.salesBarValue}>{formatPrice(order.total)}</Text>
                      <View style={styles.salesBarTrack}><View style={[styles.salesBar, { height: Math.max(12, (order.total / chartMax) * 118) }]} /></View>
                      <Text style={styles.salesBarLabel}>#{order.id.replace('ord_', '')}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {sellerSection === 'catalog' && <>
        <Text style={styles.sellerSectionTitle}>Add to catalog</Text>
        <View style={styles.sellerUploadCard}>
          <Text style={styles.uploadLabel}>Product image</Text>
          <Button mode="outlined" onPress={pickImage} textColor="#16745a" style={styles.uploadButton}>
            Upload from device
          </Button>
          {imageURL ? <Image source={{ uri: imageURL }} style={styles.uploadPreview} /> : null}
        </View>

        <TextInput style={styles.input} placeholder="New product name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} multiline />
        <Text style={styles.fieldLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sellerCategoryRow}>
          {categories.filter((item) => item !== 'All').map((item) => (
            <Chip
              key={item}
              onPress={() => setCategory(item)}
              mode={category === item ? 'flat' : 'outlined'}
              selected={category === item}
              showSelectedCheck={false}
              style={[styles.categoryChip, category === item && styles.categoryChipActive]}
              textStyle={category === item ? styles.categoryChipTextActive : styles.categoryChipText}
            >
              {item}
            </Chip>
          ))}
        </ScrollView>
        {(
          <View style={styles.promotionSetupCard}>
            <Pressable style={styles.promotionSetupToggle} onPress={() => setPromotionEnabled((current) => !current)}>
              <View style={[styles.promotionCheck, promotionEnabled && styles.promotionCheckActive]}><Text style={styles.promotionCheckText}>{promotionEnabled ? '✓' : ''}</Text></View>
              <View><Text style={styles.promotionSetupTitle}>Offer a bonus entry</Text><Text style={styles.muted}>Optional chance-based promotion for this product.</Text></View>
            </Pressable>
            {promotionEnabled && <>
              <Button mode="outlined" onPress={pickPromotionImage} textColor="#16745a" style={styles.promotionUploadButton}>
                Upload prize image
              </Button>
              {promotionPrizeImageURL ? <Image source={{ uri: promotionPrizeImageURL }} style={styles.promotionPrizePreview} /> : null}
              <TextInput style={styles.input} placeholder="Entry fee (INR)" value={promotionFee} onChangeText={setPromotionFee} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Prize name" value={promotionPrize} onChangeText={setPromotionPrize} />
            </>}
          </View>
        )}
        <View style={styles.inlineFields}>
          <TextInput style={[styles.input, styles.inlineField]} placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" />
          <TextInput style={[styles.input, styles.inlineField]} placeholder="Stock" value={stock} onChangeText={setStock} keyboardType="numeric" />
        </View>

        <Button
          mode="contained"
          onPress={() => {
            if (name.trim()) {
              const product = {
                _id: editingId || String(Date.now()),
                name,
                description: description || 'Fresh from your shop.',
                category,
                price: Number(price) || 999,
                stock: Number(stock) || 5,
                imageURL,
                ...(promotionEnabled ? { promotion: { enabled: true, entryFee: Number(promotionFee) || 399, prize: promotionPrize.trim() || 'iPhone', ...(promotionPrizeImageURL ? { prizeImageURL: promotionPrizeImageURL } : {}) } } : {}),
              };
              if (editingId) update(product);
              else add(product);
              resetForm();
            }
          }}
          buttonColor="#173f3a"
        >
          {editingId ? 'Update product' : 'Add product'}
        </Button>

        <Button onPress={back} textColor="#16745a">Back to store</Button>

        <Text style={styles.sellerSectionTitle}>Your products</Text>
        {products.map((product: Product) => (
          <View style={styles.sellerItemCard} key={product._id}>
            <Image source={{ uri: product.imageURL }} style={styles.sellerThumb} />
            <View style={styles.sellerItemInfo}>
              <Text style={styles.itemTitle}>{product.name}</Text>
              <Text style={styles.muted}>{product.stock} in stock</Text>
            </View>
            <View style={styles.inlineActions}>
              <Pressable style={styles.inventoryAction} onPress={() => editProduct(product)}>
                <Text style={styles.inventoryActionText}>Edit</Text>
              </Pressable>
              <Pressable style={styles.inventoryAction} onPress={() => deleteProduct(product)}>
                <Text style={styles.inventoryDeleteText}>Delete</Text>
              </Pressable>
            </View>
            {pendingDeleteId === product._id && (
              <View style={styles.deleteConfirmRow}>
                <Text style={styles.deleteConfirmText}>Remove this product?</Text>
                <Pressable onPress={() => { remove(product._id); if (editingId === product._id) resetForm(); setPendingDeleteId(null); }}>
                  <Text style={styles.inventoryDeleteText}>Confirm delete</Text>
                </Pressable>
                <Pressable onPress={() => setPendingDeleteId(null)}>
                  <Text style={styles.inventoryActionText}>Keep</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))}
        </>}

        {sellerSection === 'orders' && <>
        <Text style={styles.sellerSectionTitle}>Recent orders</Text>
        {orders.length === 0 ? <Text style={styles.muted}>No orders yet.</Text> : orders.map((order: StoreOrder) => (
          <View style={styles.sellerOrderCard} key={order.id}>
            <View>
              <Text style={styles.itemTitle}>Order #{order.id.replace('ord_', '')}</Text>
              <Text style={styles.muted}>{order.items.length} item{order.items.length === 1 ? '' : 's'} · {order.status}</Text>
            </View>
            <Text style={styles.sellerOrderTotal}>{formatPrice(order.total)}</Text>
          </View>
        ))}
        </>}
      </ScrollView>
    </SafeAreaView>
  );
};

export default () => (
  <PaperProvider>
    <SafeAreaProvider>
      <Shop />
    </SafeAreaProvider>
  </PaperProvider>
);

const styles = StyleSheet.create({
  announcementBar: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: 12,
    backgroundColor: '#123c2f',
  },
  announcementText: {
    color: '#e1f4e8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  menuLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    flexDirection: 'row',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 60, 47, 0.32)',
  },
  menuPanel: {
    width: 340,
    maxWidth: '86%',
    minHeight: '100%',
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 30,
    backgroundColor: '#ffffff',
    shadowColor: '#123c2f',
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: -8, height: 0 },
    elevation: 12,
  },
  menuPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 34,
  },
  menuBrand: {
    color: '#123c2f',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  menuClose: {
    color: '#16745a',
    fontSize: 13,
    fontWeight: '800',
  },
  menuEyebrow: {
    color: '#7aa28e',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  menuItem: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e2f1e7',
  },
  menuItemText: {
    color: '#123c2f',
    fontSize: 18,
    fontWeight: '700',
  },
  menuArrow: {
    color: '#39a86f',
    fontSize: 22,
    fontWeight: '300',
  },
  menuDivider: {
    height: 22,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  menuButtonLines: {
    color: '#f1dfb7',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -3,
    transform: [{ rotate: '90deg' }],
  },
  cartToast: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: '#123c2f',
    shadowColor: '#123c2f',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  toastCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    backgroundColor: '#34d399',
  },
  toastCheckText: {
    color: '#064e3b',
    fontSize: 17,
    fontWeight: '900',
  },
  toastTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  toastSubtitle: {
    color: '#b7e4c7',
    fontSize: 12,
    marginTop: 2,
  },
  page: {
    flex: 1,
    backgroundColor: '#f4f1ea',
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  wideContentWrap: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
  },
  headerWrap: {
    position: 'relative',
    zIndex: 20,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#111a18',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  wideHeader: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
  },
  headerRight: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    fontFamily: 'Georgia',
    fontWeight: '700',
    fontSize: 24,
    letterSpacing: 0,
    color: '#f7efe3',
  },
  nav: {
    fontWeight: '700',
    color: '#f7efe3',
    fontSize: 14,
  },
  bagBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bagBadge: {
    backgroundColor: '#b9633d',
    borderRadius: 999,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  bagBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 11,
  },
  profileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#173f3a',
    borderWidth: 2,
    borderColor: '#e7b96a',
  },
  profileIcon: {
    color: '#f7efe3',
    fontSize: 13,
    fontWeight: '900',
  },
  profileMenu: {
    position: 'absolute',
    top: 42,
    right: 0,
    zIndex: 40,
    width: 238,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: '#d8e3d9',
    shadowColor: '#173f3a',
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  profileEyebrow: {
    color: '#b9633d',
    fontSize: 10,
    fontWeight: '800',
  },
  profileTitle: {
    marginTop: 5,
    marginBottom: 12,
    color: '#173f3a',
    fontSize: 16,
    fontWeight: '900',
  },
  profileMenuItem: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileMenuText: {
    color: '#245545',
    fontSize: 14,
    fontWeight: '700',
  },
  profileMenuArrow: {
    color: '#16745a',
    fontSize: 18,
    fontWeight: '400',
  },
  profileLogout: {
    color: '#a0473d',
    fontSize: 14,
    fontWeight: '800',
  },
  profileDivider: {
    height: 1,
    marginVertical: 6,
    backgroundColor: '#e1e7df',
  },
  listContent: {
    paddingHorizontal: 4,
    paddingBottom: 28,
  },
  wideListContent: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    paddingHorizontal: 0,
  },
  gridRow: {
    gap: 18,
  },
  heroSection: {
    marginBottom: 22,
    minHeight: 270,
    overflow: 'hidden',
    borderRadius: 0,
    backgroundColor: '#173f3a',
    shadowColor: '#173f3a',
    shadowOpacity: 0.24,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  homeHeroImage: {
    borderRadius: 0,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 10,
    padding: 24,
  },
  heroEyebrow: {
    color: '#e7b96a',
    fontSize: 12,
    fontWeight: '800',
  },
  heroTitle: {
    maxWidth: 520,
    color: '#ffffff',
    fontFamily: 'Georgia',
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '700',
  },
  heroDescription: {
    maxWidth: 520,
    color: '#f3eee6',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  promoStrip: {
    marginTop: 8,
    marginBottom: 20,
    padding: 22,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#b9dfc9',
  },
  widePromoStrip: {
    maxWidth: 1120,
    alignSelf: 'center',
    width: '100%',
  },
  promoCopy: {
    flex: 1,
  },
  promoEyebrow: {
    color: '#16745a',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  promoTitle: {
    color: '#123c2f',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 5,
  },
  promoDescription: {
    color: '#5a7568',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  emptyList: {
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#123c2f',
  },
  categoryShelf: {
    marginTop: 0,
    marginBottom: 26,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 0,
    backgroundColor: '#fffdf8',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#dedbd3',
    shadowColor: '#173f3a',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  categoryHint: {
    color: '#e7b96a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  categorySectionTitle: {
    color: '#1d1f1c',
  },
  sectionLink: {
    fontSize: 13,
    color: '#16745a',
    fontWeight: '700',
  },
  chipsWrap: {
    paddingVertical: 4,
    paddingRight: 16,
    gap: 8,
  },
  sellerCategoryRow: {
    paddingBottom: 10,
    gap: 8,
  },
  categoryChip: {
    marginRight: 8,
    borderRadius: 999,
    backgroundColor: '#fff8eb',
    borderColor: '#d8b56c',
  },
  categoryChipActive: {
    backgroundColor: '#173f3a',
    borderColor: '#e7b96a',
    borderWidth: 1.5,
  },
  categoryChipText: {
    color: '#4d514b',
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: '#f7efe3',
    fontWeight: '800',
  },
  productCard: {
    backgroundColor: '#fffdf8',
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dedbd3',
    shadowColor: '#1d1f1c',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
    marginBottom: 16,
  },
  productCardWide: {
    flex: 1,
    maxWidth: 551,
  },
  productImage: {
    height: 230,
    width: '100%',
    backgroundColor: '#eaf7ee',
  },
  productInfo: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1d1f1c',
  },
  itemMeta: {
    fontSize: 13,
    color: '#6d716a',
    marginTop: 4,
  },
  productFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  promotionPill: {
    alignSelf: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#e7d5aa',
    color: '#173f3a',
    fontSize: 9,
    fontWeight: '800',
  },
  productActionStack: {
    alignItems: 'flex-end',
    gap: 6,
    maxWidth: '62%',
    marginRight: 8,
  },
  catalogPrizeThumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#f7efe3',
  },
  prizeGiftFallback: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#f7efe3',
    color: '#b9633d',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  catalogPrizeFrame: {
    padding: 2,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e7b96a',
    shadowColor: '#e7b96a',
    shadowOpacity: 0.72,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  price: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1f5b52',
  },
  priceLarge: {
    fontSize: 32,
    fontWeight: '900',
    color: '#16805d',
    marginBottom: 16,
  },
  detailScroll: {
    paddingBottom: 28,
  },
  wideDetailScroll: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
  },
  heroImage: {
    height: 400,
    width: '100%',
    backgroundColor: '#eaf7ee',
  },
  detailContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 24,
  },
  wideDetailContent: {
    maxWidth: 760,
    alignSelf: 'center',
    width: '100%',
  },
  detailPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  softChip: {
    backgroundColor: '#e9f7ee',
    borderColor: '#b9dfc9',
  },
  pageTitle: {
    fontFamily: 'Georgia',
    fontSize: 34,
    fontWeight: '700',
    color: '#1d1f1c',
    marginVertical: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 25,
    color: '#4f5b53',
    marginBottom: 18,
  },
  detailPromotionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 18,
    borderRadius: 16,
    backgroundColor: '#173f3a',
    borderWidth: 1,
    borderColor: '#d8b56c',
  },
  detailPromotionTitle: {
    marginTop: 4,
    color: '#f7efe3',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
  },
  detailPrizeImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#f7efe3',
  },
  detailPrizeFrame: {
    padding: 2,
    marginRight: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e7b96a',
    shadowColor: '#e7b96a',
    shadowOpacity: 0.72,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  detailPromotionCopy: {
    flex: 1,
  },
  detailPromotionToggle: {
    alignItems: 'center',
    marginLeft: 8,
  },
  detailPromotionToggleText: {
    marginTop: 4,
    color: '#f7efe3',
    fontSize: 10,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  metaBadge: {
    backgroundColor: '#eefbf3',
    color: '#166534',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontWeight: '700',
    overflow: 'hidden',
  },
  muted: {
    color: '#6d716a',
    fontSize: 13,
  },
  emptyState: {
    textAlign: 'center',
    color: '#6d716a',
    fontSize: 16,
    marginTop: 18,
    fontWeight: '600',
  },
  cartItemCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dedbd3',
    marginBottom: 12,
  },
  cartThumb: {
    width: 86,
    height: 86,
    borderRadius: 2,
    backgroundColor: '#f4f1ea',
  },
  cartItemMeta: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  cartPromotionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingRight: 8,
  },
  cartPromotionStack: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginLeft: 8,
    paddingTop: 2,
  },
  cartCheck: {
    width: 20,
    height: 20,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#b58b3e',
    backgroundColor: '#fff8eb',
  },
  cartCheckActive: {
    backgroundColor: '#173f3a',
  },
  cartCheckText: {
    color: '#f7efe3',
    fontSize: 13,
    fontWeight: '900',
  },
  cartPromotionText: {
    color: '#a8752d',
    fontSize: 11,
    fontWeight: '800',
  },
  inlineAction: {
    color: '#16745a',
    marginTop: 8,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#dedbd3',
    shadowColor: '#1d1f1c',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  summaryLabel: {
    color: '#5a7568',
    fontWeight: '700',
    marginBottom: 6,
  },
  summaryTotal: {
    fontFamily: 'Georgia',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 18,
    color: '#123c2f',
  },
  promotionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 4,
    backgroundColor: '#173f3a',
    borderWidth: 1,
    borderColor: '#d8b56c',
    shadowColor: '#173f3a',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  promotionCheck: {
    width: 26,
    height: 26,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8b56c',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  promotionCheckActive: {
    backgroundColor: '#d8b56c',
  },
  promotionCheckText: {
    color: '#173f3a',
    fontSize: 17,
    fontWeight: '900',
  },
  promotionCopy: {
    flex: 1,
  },
  promotionPrizeImage: {
    width: 58,
    height: 58,
    marginRight: 12,
    borderRadius: 14,
    backgroundColor: '#f7efe3',
  },
  promotionEyebrow: {
    color: '#e7b96a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  promotionTitle: {
    marginTop: 4,
    color: '#f7efe3',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
  },
  promotionNote: {
    marginTop: 4,
    color: '#c8d9cf',
    fontSize: 11,
    lineHeight: 16,
  },
  checkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  checkoutLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkoutLineValue: {
    color: '#173f3a',
    fontWeight: '800',
  },
  checkoutDivider: {
    height: 1,
    marginVertical: 8,
    backgroundColor: '#d9e4da',
  },
  checkoutStep: {
    color: '#5a7568',
    fontSize: 13,
    fontWeight: '800',
  },
  fieldLabel: {
    color: '#245545',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 2,
  },
  optionRow: {
    gap: 8,
    paddingVertical: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#c9d8cd',
    backgroundColor: '#fff',
  },
  optionChipActive: {
    borderColor: '#173f3a',
    backgroundColor: '#173f3a',
  },
  optionChipText: {
    color: '#245545',
    fontSize: 12,
    fontWeight: '700',
  },
  optionChipTextActive: {
    color: '#fff',
  },
  dropdown: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#c9d8cd',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  dropdownText: {
    flex: 1,
    color: '#173f3a',
    fontSize: 14,
    fontWeight: '700',
  },
  dropdownArrow: {
    marginLeft: 10,
    color: '#16745a',
    fontSize: 12,
    fontWeight: '900',
  },
  dropdownMenu: {
    maxHeight: 190,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#c9d8cd',
    borderRadius: 4,
    backgroundColor: '#fff',
    elevation: 3,
    zIndex: 5,
  },
  communityDropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#c9d8cd',
    borderRadius: 4,
    backgroundColor: '#fff',
    elevation: 3,
    zIndex: 5,
  },
  dropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1ed',
  },
  dropdownOptionText: {
    color: '#245545',
    fontSize: 13,
    fontWeight: '600',
  },
  validationMessage: {
    marginTop: 8,
    color: '#b42318',
    fontSize: 13,
    fontWeight: '700',
  },
  fieldHalf: {
    flex: 1,
    minWidth: 0,
  },
  checkoutActions: {
    marginTop: 12,
  },
  center: {
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  authPage: {
    backgroundColor: 'transparent',
  },
  authBackground: {
    flex: 1,
  },
  authBackgroundImage: {
    resizeMode: 'cover',
    width: '100%',
    height: '100%',
  },
  authBackgroundOverlay: {
    flex: 1,
  },
  authCard: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    borderRadius: 4,
    padding: 26,
    borderWidth: 1,
    borderColor: '#dedbd3',
    shadowColor: '#000000',
    shadowOpacity: 0.32,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10,
  },
  authLogo: {
    color: '#173f3a',
  },
  authEyebrow: {
    color: '#a34f32',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  authToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#f4f1ea',
    borderRadius: 4,
    padding: 4,
    marginTop: 18,
    marginBottom: 10,
  },
  authToggle: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 2,
    alignItems: 'center',
  },
  authToggleActive: {
    backgroundColor: '#173f3a',
    shadowColor: '#173f3a',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  authToggleSignInActive: {
    backgroundColor: '#173f3a',
    shadowColor: '#173f3a',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  authToggleSignUpActive: {
    backgroundColor: '#173f3a',
    shadowColor: '#173f3a',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  authToggleText: {
    color: '#6b665d',
    fontWeight: '700',
  },
  authToggleTextActive: {
    color: '#f7efe3',
  },
  authToggleSignInText: {
    color: '#f7efe3',
    fontWeight: '800',
  },
  authToggleSignUpText: {
    color: '#f7efe3',
    fontWeight: '800',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
  },
  roleOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dedbd3',
    backgroundColor: '#fffdf8',
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: 'center',
  },
  roleOptionActive: {
    backgroundColor: '#173f3a',
    borderColor: '#245f54',
    shadowColor: '#173f3a',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  roleOptionText: {
    color: '#4f5b53',
    fontWeight: '700',
  },
  roleOptionTextActive: {
    color: '#f7efe3',
  },
  primaryAuthAction: {
    marginTop: 10,
    marginBottom: 6,
  },
  authError: {
    marginTop: 8,
    color: '#a0473d',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: '#dedbd3',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 8,
    fontSize: 16,
    color: '#1d1f1c',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#dcefe3',
    borderRadius: 999,
    marginVertical: 18,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#39a86f',
    borderRadius: 999,
  },
  sellerItemCard: {
    position: 'relative',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#dedbd3',
  },
  sellerScrollContent: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 42,
  },
  sellerIntro: {
    paddingTop: 18,
    paddingBottom: 18,
  },
  sellerTabs: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    marginBottom: 18,
    borderRadius: 4,
    backgroundColor: '#dedbd3',
  },
  sellerTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 2,
  },
  sellerTabActive: {
    backgroundColor: '#173f3a',
  },
  sellerTabText: {
    color: '#617069',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  sellerTabTextActive: {
    color: '#f7efe3',
  },
  sellerEyebrow: {
    color: '#b9633d',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  sellerTitle: {
    marginTop: 5,
    color: '#173f3a',
    fontFamily: 'Georgia',
    fontSize: 34,
    fontWeight: '700',
  },
  sellerMetricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  sellerMetricCard: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 135,
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#dec99f',
    shadowColor: '#173f3a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  sellerMetricLabel: {
    color: '#6c7168',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  sellerMetricValue: {
    marginTop: 7,
    color: '#173f3a',
    fontSize: 25,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(31, 91, 82, 0.28)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  salesChartCard: {
    flexBasis: '100%',
    marginTop: 2,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#173f3a',
    shadowColor: '#173f3a',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  salesChartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  salesChartEyebrow: {
    color: '#e7b96a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  salesChartTitle: {
    marginTop: 4,
    color: '#f7efe3',
    fontSize: 19,
    fontWeight: '900',
  },
  salesChartTotal: {
    color: '#f7efe3',
    fontSize: 17,
    fontWeight: '900',
    textShadowColor: 'rgba(231, 185, 106, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  salesChart: {
    height: 170,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: 8,
  },
  salesBarColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  salesBarValue: {
    marginBottom: 5,
    color: '#c8d9cf',
    fontSize: 9,
    fontWeight: '700',
  },
  salesBarTrack: {
    height: 118,
    width: 20,
    justifyContent: 'flex-end',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  salesBar: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: '#e7b96a',
    shadowColor: '#e7b96a',
    shadowOpacity: 0.65,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  salesBarLabel: {
    marginTop: 7,
    color: '#c8d9cf',
    fontSize: 10,
    fontWeight: '700',
  },
  sellerSectionTitle: {
    marginTop: 12,
    marginBottom: 8,
    color: '#173f3a',
    fontSize: 18,
    fontWeight: '900',
  },
  sellerOrderCard: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: '#d9e4da',
  },
  sellerOrderTotal: {
    color: '#173f3a',
    fontSize: 16,
    fontWeight: '900',
  },
  sellerThumb: {
    width: 54,
    height: 54,
    borderRadius: 12,
    marginRight: 10,
  },
  sellerItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  inlineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inventoryAction: {
    minWidth: 54,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#a9b9b0',
    alignItems: 'center',
  },
  inventoryActionText: {
    color: '#173f3a',
    fontSize: 12,
    fontWeight: '800',
  },
  inventoryDeleteText: {
    color: '#a0473d',
    fontSize: 12,
    fontWeight: '800',
  },
  deleteConfirmRow: {
    flexBasis: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#fff4ed',
  },
  deleteConfirmText: {
    marginRight: 'auto',
    color: '#6e4b43',
    fontSize: 12,
    fontWeight: '700',
  },
  sellerUploadCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#d9eee0',
    marginBottom: 12,
  },
  promotionSetupCard: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: '#eef3ec',
    borderWidth: 1,
    borderColor: '#d8b56c',
  },
  promotionSetupToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promotionSetupTitle: {
    color: '#173f3a',
    fontSize: 14,
    fontWeight: '900',
  },
  promotionUploadButton: {
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
  },
  promotionPrizePreview: {
    width: '100%',
    height: 120,
    marginBottom: 4,
    borderRadius: 14,
    backgroundColor: '#dfe9e1',
  },
  uploadButton: {
    backgroundColor: '#edf9f2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadButtonText: {
    color: '#16745a',
    fontWeight: '800',
  },
  uploadLabel: {
    color: '#2f1d3f',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  uploadPreview: {
    height: 160,
    borderRadius: 16,
    width: '100%',
    backgroundColor: '#f0faf3',
  },
  inlineFields: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineField: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#d9eee0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#123c2f',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontWeight: '800',
    color: '#123c2f',
    fontSize: 15,
  },
  orderDate: {
    color: '#695d78',
    fontSize: 12,
    marginTop: 4,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    textTransform: 'capitalize',
    fontWeight: '800',
    fontSize: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  orderThumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    marginRight: 12,
  },
  orderItemMeta: {
    flex: 1,
  },
  orderPromotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#f5ead4',
    borderWidth: 1,
    borderColor: '#d8b56c',
  },
  orderPrizeThumb: {
    width: 48,
    height: 48,
    marginRight: 10,
    borderRadius: 10,
    backgroundColor: '#fff8eb',
  },
  orderPromotionCopy: {
    flex: 1,
  },
  orderPromotionLabel: {
    color: '#a8752d',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  orderTotalLabel: {
    color: '#6c7168',
    fontSize: 11,
    fontWeight: '700',
  },
  orderFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#123c2f',
  },
});

