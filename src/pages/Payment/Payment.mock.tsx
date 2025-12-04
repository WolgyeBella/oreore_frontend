import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as S from "./Payment.styled";
import PaymentMethodButtons from "./PaymentMethodButtons/PaymentMethodButtons";
import {
  CartItem,
  Checkbox,
  Button,
  InputField,
  FormContainer,
} from "components";
import Nav from "../../components/Nav/Nav.mock";
import { useLocation, useNavigate } from "react-router-dom";
import AddressSearch from "./AddressSearch/AddressSearch";
import ROUTE_LINK from "../../routes/RouterLink";
import { toast } from "react-toastify";
import axios from "axios";

import useMockAuthStore from "../../stores/useMockAuthStore";

export interface FormValues {
  name: string;
  phoneFirst: string;
  phoneSecond: string;
  postalCode: string;
  address: string;
  detailAddress: string;
  profileImage?: File;
  phone?: string;
}

interface OrderItem {
  _id: string;
  image: string;
  price: number;
  description: string;
  categoryName: string;
  name: string;
  sellerId: {
    _id: string;
  };
  payedAt: string;
}

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

interface TossPaymentError {
  code: string;
  message: string;
}

function isTossPaymentError(error: unknown): error is TossPaymentError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    typeof (error as TossPaymentError).code === "string" &&
    typeof (error as TossPaymentError).message === "string"
  );
}

const PaymentPage: React.FC = () => {
  const methods = useForm<FormValues>();
  const { setValue, clearErrors, handleSubmit } = methods;
  const location = useLocation();
  const navigate = useNavigate();

  const [isChecked, setIsChecked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [phoneFirst, setPhoneFirst] = useState("");
  const [phoneSecond, setPhoneSecond] = useState("");
  const [addressInfo, setAddressInfo] = useState<FormValues>({
    name: "",
    phoneFirst: "",
    phoneSecond: "",
    postalCode: "",
    address: "",
    detailAddress: "",
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("bank");
  const [requestMessage, setRequestMessage] = useState("");

  const buyerId = useMockAuthStore((state) => state.user?.id);

  // mockItems.json에서 상품 정보 가져오기
  const getMockItem = async (productId: string) => {
    try {
      const response = await axios.get("/data/mockItems.json");
      const mockItems: MockItem[] = response.data;
      const foundItem = mockItems.find(
        (item) => item.id.toString() === productId,
      );

      if (foundItem) {
        return {
          _id: foundItem.id.toString(),
          name: foundItem.itemName,
          image: foundItem.imageSrc,
          price: foundItem.price,
          description: foundItem.description,
          categoryName: foundItem.categoryName,
          sellerId: {
            _id: "mock-seller-id",
          },
          payedAt: foundItem.purchaseDate,
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to load mock item:", error);
      return null;
    }
  };

  useEffect(() => {
    // mockUsers.json에서 사용자 정보 가져오기
    const loadUserInfo = async () => {
      const authStorage = JSON.parse(
        localStorage.getItem("mock-auth-storage") || "{}",
      );
      const userInfo = authStorage.state?.user;

      if (userInfo) {
        const userPhone = userInfo.phone || "";
        const userAddressInfo = {
          name: userInfo.name || "",
          phoneFirst: userPhone.slice(0, 3) || "",
          phoneSecond: userPhone.slice(3) || "",
          postalCode: userInfo.postalCode || "",
          address: userInfo.basicAdd || "",
          detailAddress: userInfo.detailAdd || "",
        };

        setPhoneFirst(userAddressInfo.phoneFirst);
        setPhoneSecond(userAddressInfo.phoneSecond);

        setAddressInfo(userAddressInfo);

        if (isEditing) {
          setValue("name", userAddressInfo.name);
          setValue("phoneFirst", userAddressInfo.phoneFirst);
          setValue("phoneSecond", userAddressInfo.phoneSecond);
          setValue("postalCode", userAddressInfo.postalCode);
          setValue("address", userAddressInfo.address);
          setValue("detailAddress", userAddressInfo.detailAddress);
        }
      }
    };

    loadUserInfo();

    // 장바구니에서 선택된 상품들
    if (location.state && location.state.selectedItems) {
      setOrderItems(location.state.selectedItems);
    }
  }, [location.state, setValue, isEditing]);

  useEffect(() => {
    // 바로구매하기로 온 경우
    const productId = location.state?.id;

    if (productId) {
      getMockItem(productId)
        .then((product) => {
          if (product) {
            setOrderItems([product]);
          } else {
            toast.error("상품 정보를 불러오는 데 실패했습니다.");
            navigate(ROUTE_LINK.DETAIL.path.replace(":productId", productId));
          }
        })
        .catch(() => {
          toast.error("상품 정보를 불러오는 데 실패했습니다.");
          navigate(ROUTE_LINK.DETAIL.path.replace(":productId", productId));
        });
    }
  }, [location.state, navigate]);

  const handleEditAddress = () => {
    setIsEditing(true);
  };

  const handleSaveAddress = (data: FormValues) => {
    setIsEditing(false);

    const combinedPhone = `${data.phoneFirst}${data.phoneSecond}`;

    const updatedAddressInfo = {
      ...data,
      phoneFirst: data.phoneFirst,
      phoneSecond: data.phoneSecond,
    };

    setAddressInfo({ ...updatedAddressInfo, phone: combinedPhone });

    // mock-auth-storage에 저장
    const authStorage = JSON.parse(
      localStorage.getItem("mock-auth-storage") || "{}",
    );
    if (authStorage.state?.user) {
      authStorage.state.user = {
        ...authStorage.state.user,
        name: data.name,
        phone: combinedPhone,
        postalCode: data.postalCode,
        basicAdd: data.address,
        detailAdd: data.detailAddress,
      };
      localStorage.setItem("mock-auth-storage", JSON.stringify(authStorage));
    }
  };

  const handleCheckBoxChange = () => {
    setIsChecked((prev) => !prev);
    console.log("주문내역 확인 및 결제 동의 체크:", !isChecked);
  };

  const handlePayment = async () => {
    if (!isChecked) {
      toast.warn("주문내역 확인 및 결제 동의를 체크해주세요.");
      return;
    }
    try {
      const today = new Date();
      const formattedDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
      if (paymentMethod === "bank") {
        const paymentInfo = {
          items: orderItems,
          totalAmount: orderItems.reduce(
            (total, item) => total + item.price,
            0,
          ),
          payedAt: formattedDate,
          buyerId,
        };

        localStorage.setItem("paymentInfo", JSON.stringify(paymentInfo));
        localStorage.removeItem("products");

        navigate(ROUTE_LINK.BANK_PAYMENT_COMPLETE.path);
      } else if (paymentMethod === "toss") {
        const refinedItems = orderItems.map((item) => ({
          categoryName: item.categoryName,
          description: item.description || "",
          image: item.image,
          name: item.name,
          price: item.price,
          sellerId: item.sellerId._id,
          productId: item._id,
          payedAt: formattedDate,
        }));

        const totalAmount = orderItems.reduce(
          (total, item) => total + item.price,
          0,
        );

        const orderInfo = {
          paymentKey: "mock_payment_key",
          name: addressInfo.name,
          phone: `${phoneFirst}${phoneSecond}`,
          postalCode: addressInfo.postalCode,
          address: addressInfo.address,
          detailAddress: addressInfo.detailAddress,
          requestMessage,
          items: refinedItems,
          totalAmount,
          buyerId,
        };

        // 목데이터 기반이므로 Toss Payments SDK 호출 없이 바로 PaymentComplete로 이동
        const mockOrderId = `mock-order-${Date.now()}`;
        localStorage.setItem("orderInfo", JSON.stringify(orderInfo));
        localStorage.removeItem("products");

        // PaymentComplete로 이동 (목데이터 기반이므로 query parameter 전달)
        navigate(
          `${ROUTE_LINK.PAYMENT_COMPLETE.path}?orderId=${mockOrderId}&paymentKey=mock_payment_key&amount=${totalAmount}`,
        );
      }
    } catch (error) {
      if (isTossPaymentError(error)) {
        console.error("결제 요청 중 오류:", error);

        if (error.code === "USER_CANCELLED") {
          toast.error("결제가 취소되었습니다.");
          navigate(ROUTE_LINK.PAYMENT_FAIL.path, {
            state: { message: error.message, code: error.code },
          });
        } else {
          toast.error("결제 중 오류가 발생했습니다.");
          navigate(ROUTE_LINK.PAYMENT_FAIL.path, {
            state: {
              message: error.message || "알 수 없는 오류",
              code: error.code || "UNKNOWN",
            },
          });
        }
      } else {
        console.error("알 수 없는 오류 발생:", error);
        toast.error("예상치 못한 오류가 발생했습니다.");
      }
    }
  };

  const totalAmount = orderItems.reduce((total, item) => total + item.price, 0);

  return (
    <>
      <Nav />
      <S.Container>
        <S.LeftSection>
          <S.Title>주문/결제</S.Title>

          <S.Section>
            <S.SectionTitle>주문자 정보</S.SectionTitle>
            <S.OrderInfo>
              {isEditing ? (
                <FormContainer onSubmit={handleSaveAddress} methods={methods}>
                  <S.InputContainer>
                    <InputField
                      name="name"
                      label="이름"
                      placeholder="이름을 입력하세요"
                      value={addressInfo.name}
                      onChange={(e) =>
                        setAddressInfo({ ...addressInfo, name: e.target.value })
                      }
                    />
                  </S.InputContainer>
                  <S.InputContainer>
                    <InputField
                      name="postalCode"
                      label="우편번호"
                      placeholder="우편번호를 입력하세요"
                      readOnly
                      value={addressInfo.postalCode}
                    />
                    <AddressSearch
                      setValue={setValue}
                      clearErrors={clearErrors}
                    />
                  </S.InputContainer>
                  <S.InputContainer
                    style={{ flexDirection: "column", gap: "10px" }}
                  >
                    <InputField
                      name="address"
                      placeholder="주소를 입력하세요"
                      readOnly
                      value={addressInfo.address}
                      onChange={(e) =>
                        setAddressInfo({
                          ...addressInfo,
                          address: e.target.value,
                        })
                      }
                    />
                    <InputField
                      name="detailAddress"
                      placeholder="상세 주소를 입력하세요"
                      value={addressInfo.detailAddress}
                      onChange={(e) =>
                        setAddressInfo({
                          ...addressInfo,
                          detailAddress: e.target.value,
                        })
                      }
                    />
                  </S.InputContainer>
                  <S.InputContainer style={{ gap: "10px" }}>
                    <InputField
                      name="phoneFirst"
                      label="전화번호"
                      placeholder="앞자리"
                      value={phoneFirst}
                      onChange={(e) => setPhoneFirst(e.target.value)}
                    />
                    <InputField
                      name="phoneSecond"
                      placeholder="나머지 번호"
                      value={phoneSecond}
                      onChange={(e) => setPhoneSecond(e.target.value)}
                    />
                  </S.InputContainer>
                  <Button
                    width="100%"
                    btnText="저장하기"
                    onClick={handleSubmit(handleSaveAddress)}
                    bgcolor="blue70"
                  />
                </FormContainer>
              ) : (
                <S.AddressInfo>
                  <div>
                    <strong>{addressInfo.name}</strong>
                    <div className="flexWrap">
                      <span>({addressInfo.postalCode})</span>
                      <span>{addressInfo.detailAddress}</span>
                      <span>{addressInfo.address}</span>
                    </div>
                    <span>
                      {addressInfo.phoneFirst}
                      {addressInfo.phoneSecond}
                    </span>
                  </div>
                  <S.EditButton onClick={handleEditAddress}>변경</S.EditButton>
                </S.AddressInfo>
              )}
              <S.RequestContainer>
                <label>거래 요청 사항</label>
                <span>판매자에게 전달되는 요청사항이에요.</span>
                <input
                  type="text"
                  placeholder="예: 포장 꼼꼼하게 부탁드려요"
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                />
              </S.RequestContainer>
            </S.OrderInfo>
          </S.Section>

          <S.Section>
            <S.SectionTitle>주문 상품</S.SectionTitle>
            <S.ItemContainer>
              {orderItems.map((item) => (
                <CartItem
                  page="cart"
                  key={item._id}
                  imageSrc={item.image}
                  title={`${item.price.toLocaleString()}원`}
                  description={item.description}
                />
              ))}
            </S.ItemContainer>
          </S.Section>

          <S.Section>
            <S.SectionTitle>결제수단</S.SectionTitle>
            <S.PaymentMethod>
              <PaymentMethodButtons
                selectedMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
              />
            </S.PaymentMethod>
          </S.Section>
        </S.LeftSection>

        <S.RightSection>
          <S.SummaryBox>
            <S.SummaryTitle>결제금액</S.SummaryTitle>
            <S.TotalAmount>
              총 상품 금액 <span>{totalAmount.toLocaleString()}원</span>
            </S.TotalAmount>
            <div>
              <S.Wrap>
                <Checkbox checked={isChecked} onChange={handleCheckBoxChange} />
                <S.AgreementText>주문내역 확인 및 결제 동의</S.AgreementText>
              </S.Wrap>
              <S.AgreementTextBox>
                본인은 만 14세 이상이며, 주문 내용을 확인하였습니다.
                (주)오래오래 통신판매중개자로 거래 당사자가 아니므로, 판매자가
                등록한 상품정보 및 거래 등에 대해 책임을 지지 않습니다 (단,
                (주)오래오래 판매자로 등록 판매한 상품은 판매자로서 책임을
                부담합니다).
              </S.AgreementTextBox>
            </div>
            <Button
              btnText="결제하기"
              onClick={handlePayment}
              bgcolor="orange70"
              width="100%"
            />
          </S.SummaryBox>
        </S.RightSection>
      </S.Container>
    </>
  );
};

export default PaymentPage;
