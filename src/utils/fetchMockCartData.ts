import axios from "axios";

interface MockItem {
  id: number;
  itemName: string;
  imageSrc: string;
  price: number;
  description: string;
  shopName: string;
  categoryName: string;
  purchaseDate: string;
}

interface CartItem {
  _id: string;
  name: string;
  image: string;
  price: number;
  description: string;
  shop: {
    nickname: string;
    _id: string;
  };
  checked: boolean;
}

export const fetchMockCartData = async (): Promise<
  { shopName: string; items: CartItem[] }[]
> => {
  const localCart = JSON.parse(localStorage.getItem("products") || "[]");

  // mockItems.json에서 모든 상품 정보 가져오기
  const response = await axios.get("/data/mockItems.json");
  const mockItems: MockItem[] = response.data;

  // localStorage의 장바구니 아이템과 mockItems.json 매칭
  const items: CartItem[] = localCart.map(
    (cartItem: {
      id: string;
      shop: { nickname: string; _id: string };
      itemInfo?: {
        _id: string;
        name: string;
        image: string;
        price: number;
        description: string;
        categoryName: string;
      };
    }) => {
      // itemInfo가 있으면 사용, 없으면 mockItems에서 찾기
      if (cartItem.itemInfo) {
        return {
          _id: cartItem.itemInfo._id,
          name: cartItem.itemInfo.name,
          image: cartItem.itemInfo.image,
          price: cartItem.itemInfo.price,
          description: cartItem.itemInfo.description,
          shop: cartItem.shop,
          checked: cartItem.checked || false,
        };
      } else {
        // 기존 방식: mockItems에서 찾기
        const foundItem = mockItems.find(
          (item) => item.id.toString() === cartItem.id,
        );
        if (foundItem) {
          return {
            _id: foundItem.id.toString(),
            name: foundItem.itemName,
            image: foundItem.imageSrc,
            price: foundItem.price,
            description: foundItem.description,
            shop: cartItem.shop,
            checked: cartItem.checked || false,
          };
        }
        return null;
      }
    },
  ).filter((item): item is CartItem => item !== null);

  // 상점별로 그룹화
  const groupedByShop = items.reduce(
    (acc: Record<string, { shopId: string; items: CartItem[] }>, item) => {
      const shopKey = item.shop.nickname;

      if (!acc[shopKey]) {
        acc[shopKey] = {
          shopId: item.shop._id,
          items: [],
        };
      }
      acc[shopKey].items.push(item);
      return acc;
    },
    {},
  );

  return Object.entries(groupedByShop).map(([shopName, { shopId, items }]) => ({
    shopName,
    shopId,
    items,
  }));
};

