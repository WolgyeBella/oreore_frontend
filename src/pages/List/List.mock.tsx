import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import { ItemCard, Dropdown, Sidebar } from "components";
import Nav from "../../components/Nav/Nav.mock";
import Carousel from "./Carousel/Carousel.tsx";

import { ItemProps } from "components/ItemCard/ItemCard.tsx";
import { CarouselItem } from "../../types/types.ts";

import { S } from "./List.style";
import useDropdown from "../../hooks/useDropdown";
import ScrollUp from "../../components/ScrollUp/ScrollUp";
import scrollToTop from "../../utils/scrollToTop";

const options = ["최신순", "오래된순"];

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

const List = () => {
  const [items, setItems] = useState<ItemProps[]>([]);
  const [allMockItems, setAllMockItems] = useState<MockItem[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const limit = 12;
  const [filteredItemsCount, setFilteredItemsCount] = useState(0);
  const totalPage = Math.ceil(filteredItemsCount / limit);

  const [carouselData, setCarouselData] = useState<CarouselItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { selectedItem, handleSelect } = useDropdown(options);
  const [, setSearchParams] = useSearchParams();

  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const categoryName = params.get("categoryName");

  // mockItems.json과 localStorage의 myProducts에서 데이터 가져오기
  const getMockItems = async () => {
    try {
      const response = await axios.get("/data/mockItems.json");
      const mockItems: MockItem[] = response.data;

      // localStorage에서 사용자가 등록한 상품 가져오기
      const myProducts = JSON.parse(localStorage.getItem("myProducts") || "[]");

      // myProducts를 MockItem 형식으로 변환
      interface LocalProduct {
        _id: string;
        name: string;
        image: string;
        price: number;
        description: string;
        sellerId?: { nickname: string };
        categoryName: string;
        createdAt?: string;
      }

      const localProducts: MockItem[] = myProducts.map(
        (product: LocalProduct) => ({
          id: parseInt(product._id.replace("product-", "")) || Date.now(),
          itemName: product.name,
          imageSrc: product.image,
          price: product.price,
          description: product.description,
          shopName: product.sellerId?.nickname || "상점",
          categoryName: product.categoryName,
          purchaseDate:
            product.createdAt || new Date().toISOString().split("T")[0],
        }),
      );

      // mockItems와 localProducts 합치기
      setAllMockItems([...mockItems, ...localProducts]);
    } catch (err) {
      console.error("Failed to load mock items:", err);
    }
  };

  // 목데이터를 ItemCard 형식으로 변환
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

  // 상품 목록 처리 (정렬, 필터링, 페이지네이션)
  const processItems = useCallback(() => {
    let processedItems = [...allMockItems];

    // 카테고리 필터링
    if (categoryName) {
      processedItems = processedItems.filter(
        (item) => item.categoryName === categoryName,
      );
    }

    // 필터링된 아이템 개수 저장
    setFilteredItemsCount(processedItems.length);

    // 정렬
    if (selectedItem === "오래된순") {
      processedItems.sort((a, b) => a.id - b.id);
    } else {
      processedItems.sort((a, b) => b.id - a.id);
    }

    // 페이지네이션
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = processedItems.slice(startIndex, endIndex);

    // ItemCard 형식으로 변환
    const transformedItems = paginatedItems.map((item, index) => {
      const itemProps = transformMockItemToItemProps(item);
      const column = 4;
      const row = Math.floor((startIndex + index) / column) + 1;
      return {
        ...itemProps,
        idx: startIndex + index,
        row: row,
      };
    });

    // 첫 페이지면 새로 설정, 그 외에는 이전 아이템들에 추가
    setItems((prevItems) =>
      currentPage === 1
        ? transformedItems
        : [...prevItems, ...transformedItems],
    );
  }, [allMockItems, categoryName, selectedItem, currentPage, limit]);

  const handleCategoryClick = (id: string) => {
    setSelectedCategory(id);
    setCurrentPage(1);
    setSearchParams({ categoryName: id, currentPage: "1" });
  };

  const handleClickMoreBtn = () => {
    if (currentPage < totalPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleShowAllBtn = () => {
    setSelectedCategory(null);
    setCurrentPage(1);
    setSearchParams({});
  };

  const getCarousel = async () => {
    try {
      const response = await axios.get("/data/carousel.json");
      setCarouselData(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getMockItems();
  }, []);

  useEffect(() => {
    if (allMockItems.length > 0) {
      processItems();
    }
  }, [allMockItems, processItems]);

  useEffect(() => {
    getCarousel();
  }, []);

  return (
    <S.ListWrap>
      <Nav />
      <S.List>
        <Sidebar
          selectedCategory={selectedCategory}
          onClick={handleCategoryClick}
        />
        <S.ListContent>
          <Carousel carouselData={carouselData} />
          <S.DropdownWrap>
            <Dropdown
              options={options}
              selectedItem={selectedItem}
              onClick={handleSelect}
            />
          </S.DropdownWrap>

          <S.ItemGrid>
            {items.length > 0 ? (
              items.map((item) => {
                return (
                  <Link to={`/products/${item._id}`} key={item._id}>
                    <ItemCard {...item} />
                  </Link>
                );
              })
            ) : (
              <S.NoItem>등록된 상품이 없습니다.</S.NoItem>
            )}
            {categoryName ? (
              // 카테고리가 선택된 경우 "전체보기" 버튼 표시
              <S.MoreBtnWrap>
                <S.MoreBtn onClick={handleShowAllBtn}>전체보기</S.MoreBtn>
              </S.MoreBtnWrap>
            ) : (
              // 카테고리가 선택되지 않은 경우 "더보기" 버튼 표시
              currentPage < totalPage && (
                <S.MoreBtnWrap>
                  <S.MoreBtn onClick={handleClickMoreBtn}>더보기</S.MoreBtn>
                </S.MoreBtnWrap>
              )
            )}
            <ScrollUp onClick={scrollToTop} />
          </S.ItemGrid>
        </S.ListContent>
      </S.List>
    </S.ListWrap>
  );
};

export default List;
