import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import { Button, ConfirmModal } from "components";
import Nav from "../../components/Nav/Nav.mock";

import formatPrice from "../../utils/formatPrice";

import { ItemProps } from "components/ItemCard/ItemCard";

import { S } from "./Detail.style";
import useModalStore from "../../stores/modal/index";
import { toast } from "react-toastify";
import useMockAuthStore from "../../stores/useMockAuthStore";
import ScrollUp from "../../components/ScrollUp/ScrollUp";
import scrollToTop from "../../utils/scrollToTop";

interface CartItemsProps {
  id: string;
  checked: boolean;
  shop: { _id: string; nickname: string };
  itemInfo?: {
    _id: string;
    name: string;
    image: string;
    price: number;
    description: string;
    categoryName: string;
  };
}

interface MockItem {
  id: number;
  itemName: string;
  imageSrc: string;
  price: number;
  description: string;
  shopName: string;
  purchaseDate: string;
}

const Detail = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [item, setItem] = useState<ItemProps | null>(null);

  const sellerBoxRef = useRef<HTMLDivElement | null>(null);
  const [, setIsSellerBoxVisible] = useState(false);

  const { modalType, closeModal } = useModalStore();
  const user = useMockAuthStore();

  // 목데이터를 ItemProps 형식으로 변환
  const transformMockItemToItemProps = (mockItem: MockItem): ItemProps => {
    return {
      _id: mockItem.id.toString(),
      name: mockItem.itemName,
      image: mockItem.imageSrc,
      price: mockItem.price,
      description: mockItem.description,
      categoryName: mockItem.shopName,
      soldOut: false,
      sellerId: {
        _id: "mock-seller-id",
        nickname: mockItem.shopName,
      },
      createdAt: mockItem.purchaseDate,
      updatedAt: mockItem.purchaseDate,
      deletedAt: null,
      __v: 0,
      idx: 0,
      row: 0,
      deleteProduct: () => {},
    };
  };

  // mockItems.json에서 상품 데이터 가져오기
  const getMockItem = async () => {
    try {
      const response = await axios.get("/data/mockItems.json");
      const mockItems: MockItem[] = response.data;
      const foundItem = mockItems.find(
        (item) => item.id.toString() === productId,
      );

      if (foundItem) {
        const transformedItem = transformMockItemToItemProps(foundItem);
        setItem(transformedItem);
      } else {
        toast.error("상품을 찾을 수 없습니다.");
        navigate("/");
      }
    } catch (error) {
      console.error("Failed to load mock item:", error);
      toast.error("상품 정보를 불러오는데 실패했습니다.");
      navigate("/");
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsSellerBoxVisible(entry.isIntersecting);
    });

    if (sellerBoxRef.current) {
      observer.observe(sellerBoxRef.current);
    }

    return () => {
      if (sellerBoxRef.current) {
        observer.unobserve(sellerBoxRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (productId) {
      getMockItem();
      closeModal();
    }
  }, [productId]);

  const addToCart = () => {
    const cartItems = localStorage.getItem("products")
      ? JSON.parse(localStorage.getItem("products")!)
      : [];

    const newItem = {
      id: productId,
      checked: false,
      shop: item?.sellerId,
      // 상품 정보도 함께 저장
      itemInfo: {
        _id: item?._id,
        name: item?.name,
        image: item?.image,
        price: item?.price,
        description: item?.description,
        categoryName: item?.categoryName,
      },
    };

    const check = cartItems.find(
      (item: CartItemsProps) => item.id === productId,
    );

    if (!check) {
      cartItems.push(newItem);
      localStorage.setItem("products", JSON.stringify(cartItems));
      toast.success("✨장바구니에 상품이 등록되었습니다.");
    } else toast.error("이미 장바구니에 등록된 상품입니다.");
  };

  const handleModalBtnClick = () => {
    closeModal();
    navigate("/cart");
  };

  const handleEditBtn = () => {
    const userId = user.user?.id;

    if (userId === item?.sellerId._id) {
      navigate("/editproduct", { state: productId });
    } else toast.warn("다른 사람의 상품입니다.");
  };

  const purchase = () => {
    const newItem = { id: productId, checked: false, shop: item?.sellerId };

    navigate("/payment", { state: newItem });
  };

  const handleSellerInfoClick = () => {
    if (sellerBoxRef.current) {
      sellerBoxRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  if (!item) return null;
  return (
    <S.DetailWrap>
      {modalType === "addCartItem" && (
        <ConfirmModal
          width="140px"
          modalText="장바구니로 이동하시겠습니까?"
          onClick={handleModalBtnClick}
        />
      )}
      {modalType === "existCartItem" && (
        <ConfirmModal
          modalText="이미 장바구니에 담겨있습니다."
          onClick={closeModal}
        />
      )}
      <Nav />

      <S.Detail>
        <S.StickyWrap>
          <S.UpperWrap>
            <S.ProductImg imgUrl={item.image} />
            <S.ProductInfo>
              <div>
                {user.user?.id === item.sellerId._id && (
                  <S.EditBtn onClick={handleEditBtn} />
                )}

                <S.ProductName>{item.name}</S.ProductName>
                <S.ProductPrice>
                  <S.Bold>{formatPrice(item.price)}</S.Bold> 원
                </S.ProductPrice>
                <S.InfoBox>
                  <S.SellerIcon />
                  <S.greyText>{item.sellerId.nickname}</S.greyText>
                </S.InfoBox>
                <S.InfoBox>
                  <S.DeliveryIcon />
                  <S.greyText>배송비 무료</S.greyText>
                </S.InfoBox>
              </div>

              <S.BtnWrap>
                <Button
                  btnText="장바구니 담기"
                  bgcolor="blue70"
                  onClick={addToCart}
                />
                <Button
                  btnText="바로구매 하기"
                  bgcolor="orange70"
                  onClick={purchase}
                />
              </S.BtnWrap>
            </S.ProductInfo>
          </S.UpperWrap>

          <S.NavBar>
            <S.NavCell>
              <S.NavText>상품 정보</S.NavText>
            </S.NavCell>
            <S.NavCell>
              <S.NavText onClick={handleSellerInfoClick}>판매자 정보</S.NavText>
            </S.NavCell>
          </S.NavBar>

          <S.LowerWrap>
            <S.Description>
              <S.Pre>{item.description}</S.Pre>
            </S.Description>
            <S.SellerBox ref={sellerBoxRef}>
              <S.SellerIcon />
              <S.greyText>{item.sellerId.nickname}</S.greyText>
              <ScrollUp onClick={scrollToTop} />
            </S.SellerBox>
          </S.LowerWrap>
        </S.StickyWrap>
      </S.Detail>
    </S.DetailWrap>
  );
};

export default Detail;
