import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ROUTE_LINK from "../../routes/RouterLink";

import { Button, ItemCard, CartItem, ConfirmModal } from "components";
import Nav from "../../components/Nav/Nav.mock";

import { CartItems } from "../../types/types";
import { ItemProps } from "../../components/ItemCard/ItemCard";

import { S } from "./MyPage.style";
import useModalStore from "../../stores/modal";
import { toast } from "react-toastify";
import useMockAuthStore from "../../stores/useMockAuthStore";

interface LocalProduct {
  _id: string;
  name: string;
  image: string;
  price: number;
  description: string;
  categoryName: string;
  sellerId?: {
    _id: string;
    nickname: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

const MyPage = () => {
  const navigate = useNavigate();
  const [sellingItems, setSellingItems] = useState<ItemProps[]>([]);

  const [pageNum, setPageNum] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const limit = 6;

  const [purchasedItems, setPurchasedItems] = useState<CartItems[]>([]);
  const [filteredCartItems, setFilteredCartItems] = useState<
    {
      date: string;
      items: CartItems[];
    }[]
  >([]);
  const { modalType, closeModal } = useModalStore();
  const user = useMockAuthStore();

  const deleteProduct = async (
    id: string,
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const myProducts = JSON.parse(
        localStorage.getItem("myProducts") || "[]",
      );
      const updatedProducts = myProducts.filter(
        (item: LocalProduct) => item._id !== id,
      );
      localStorage.setItem("myProducts", JSON.stringify(updatedProducts));
      toast.success("✨상품이 삭제되었습니다.");
      getSellingItems();
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("상품 삭제 중 오류가 발생했습니다.");
    }
  };

  // localStorage에서 판매중인 상품 가져오기
  const getSellingItems = () => {
    try {
      const myProducts = JSON.parse(
        localStorage.getItem("myProducts") || "[]",
      );
      // 현재 사용자가 등록한 상품만 필터링
      const userProducts = myProducts.filter(
        (item: LocalProduct) => item.sellerId?._id === user.user?.id,
      );

      const startIndex = (currentPage - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedItems = userProducts.slice(startIndex, endIndex);

      // ItemProps 형식으로 변환
      const transformedItems: ItemProps[] = paginatedItems.map(
        (item: LocalProduct, idx: number) => {
          const column = 3;
          const row = Math.floor(idx / column) + 1;
          return {
            _id: item._id,
            name: item.name,
            image: item.image,
            price: item.price,
            description: item.description,
            categoryName: item.categoryName,
            soldOut: false,
            sellerId: item.sellerId || {
              _id: user.user?.id || "",
              nickname: user.user?.nickname || "",
            },
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString(),
            deletedAt: null,
            __v: 0,
            idx: idx,
            row: row,
            deleteProduct: deleteProduct,
          };
        },
      );

      setSellingItems(transformedItems);
      setTotalPage(Math.ceil(userProducts.length / limit));
    } catch (error) {
      console.error("Failed to load selling items:", error);
      setSellingItems([]);
      setTotalPage(1);
    }
  };

  // localStorage에서 구매 내역 가져오기
  const getPurchased = () => {
    try {
      const orderInfo = localStorage.getItem("orderInfo");
      if (orderInfo) {
        const order = JSON.parse(orderInfo);
        // 현재 사용자가 구매한 상품만 필터링
        if (order.buyerId === user.user?.id && order.items) {
          interface OrderItem {
            productId?: string;
            _id?: string;
            name: string;
            image: string;
            price: number;
            description?: string;
            categoryName?: string;
          }
          const purchased: CartItems[] = order.items.map((item: OrderItem) => ({
            id: item.productId || item._id,
            itemName: item.name,
            imageSrc: item.image,
            price: item.price,
            description: item.description || "",
            shopName: item.categoryName || "상점",
            purchaseDate: order.payedAt || new Date().toISOString().split("T")[0],
          }));
          setPurchasedItems(purchased);
        } else {
          setPurchasedItems([]);
        }
      } else {
        setPurchasedItems([]);
      }
    } catch (error) {
      console.error("Failed to load purchased items:", error);
      setPurchasedItems([]);
    }
  };

  useEffect(() => {
    getSellingItems();
    getPurchased();
  }, [user.user?.id]);

  useEffect(() => {
    getSellingItems();
  }, [currentPage]);

  const editProfile = () => {
    navigate(ROUTE_LINK.PASSWORD_CHECK.path);
  };

  const addproduct = () => {
    navigate(ROUTE_LINK.ADD_PRODUCT.path);
  };

  const paginationNum = () => {
    const nums: number[] = [];
    for (let i = 1; i <= totalPage; i++) {
      nums.push(i);
    }
    setPageNum(nums);
  };

  const goToPrevPage = () => {
    if (currentPage !== 1) {
      setCurrentPage((prev) => prev - 1);
    } else return;
  };

  const goToNextPage = () => {
    if (currentPage < totalPage) {
      setCurrentPage((prev) => prev + 1);
    } else return;
  };

  useEffect(() => {
    paginationNum();
  }, [sellingItems, totalPage]);

  const handleDeleteModalClick = () => {
    getSellingItems();
    closeModal();
  };

  useEffect(() => {
    let dates: string[] = [];

    const uniqueDates = [
      ...new Set(purchasedItems.map((item) => item.purchaseDate)),
    ];
    dates = uniqueDates;

    const groupedCartItems = dates.map((date) => ({
      date,
      items: purchasedItems.filter(
        (cartItem) => cartItem.purchaseDate === date,
      ),
    }));

    setFilteredCartItems(groupedCartItems);
  }, [purchasedItems]);

  return (
    <S.MyPageWrap>
      {modalType === "deleteProduct" && (
        <ConfirmModal
          modalText="상품이 삭제되었습니다"
          onClick={handleDeleteModalClick}
        />
      )}
      <Nav />
      <S.MyPage>
        <S.SideProfile>
          <S.ProfileImg
            src={user.user?.image ? user.user.image : "/icons/profile.svg"}
          />
          <S.UserName>{user.user?.nickname}</S.UserName>
          <Button
            btnText="정보 수정하기"
            bgcolor="orange70"
            onClick={editProfile}
          />
          <Button
            btnText="상품 등록하기"
            bgcolor="orange70"
            onClick={addproduct}
          />
        </S.SideProfile>
        <S.MyPageContent>
          <S.SellingBox>
            <S.TitleBox>판매중인 상품</S.TitleBox>
            <S.ItemGrid>
              {sellingItems.length > 0 ? (
                sellingItems.map((sellingItem, idx) => {
                  const column = 3;
                  const row = Math.floor(idx / column) + 1;

                  return (
                    <Link
                      to={`/products/${sellingItem._id}`}
                      key={sellingItem._id}
                    >
                      <ItemCard
                        {...sellingItem}
                        idx={idx}
                        row={row}
                        deleteProduct={deleteProduct}
                      />
                    </Link>
                  );
                })
              ) : (
                <S.EmptyCart>판매 중인 상품이 없습니다.</S.EmptyCart>
              )}
            </S.ItemGrid>
            {totalPage > 1 && (
              <S.PaginationBox>
                <S.ArrowIconBox>
                  <S.LeftArrowIcon onClick={goToPrevPage} />
                </S.ArrowIconBox>
                {pageNum.map((num) => {
                  return (
                    <S.PaginationNum
                      key={num}
                      num={num}
                      currentPage={currentPage}
                      onClick={() => setCurrentPage(num)}
                    >
                      {num}
                    </S.PaginationNum>
                  );
                })}
                <S.ArrowIconBox>
                  <S.RightArrowIcon onClick={goToNextPage} />
                </S.ArrowIconBox>
              </S.PaginationBox>
            )}
          </S.SellingBox>
          <S.PurchaseList>
            <S.TitleBox>구매 내역</S.TitleBox>
            {purchasedItems.length > 0 ? (
              filteredCartItems.map(({ date, items }) => (
                <div key={date}>
                  <S.DateTitle>{date}</S.DateTitle>
                  {items.map((cartItem) => (
                    <S.CartGrid key={cartItem.id}>
                      <Link to={`/products/${cartItem.id}`}>
                        <CartItem
                          page="mypage"
                          imageSrc={cartItem.imageSrc}
                          title={cartItem.itemName}
                          description={`${cartItem.price.toLocaleString()} 원`}
                        />
                      </Link>

                      <S.Shop>
                        <S.ShopIconCircle>
                          <S.ShopIcon />
                        </S.ShopIconCircle>
                        {cartItem.shopName}
                      </S.Shop>
                    </S.CartGrid>
                  ))}
                </div>
              ))
            ) : (
              <S.EmptyCart>구매 내역이 없습니다.</S.EmptyCart>
            )}
          </S.PurchaseList>
        </S.MyPageContent>
      </S.MyPage>
    </S.MyPageWrap>
  );
};

export default MyPage;

