import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
//import { ProductList } from '../pages/Home/styles';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productInCart = cart.find(product=>product.id===productId)

      if(productInCart){
        const amount = productInCart.amount+1
        return await updateProductAmount({productId,amount})
      }
      
      const productResponse = await api.get(`products/${productId}`)

      if(productResponse){
        const {id, title, price, image} = productResponse.data
        
        const product:Product = {
          id,
          title,
          price,
          image,
          amount:1
        }
              
        setCart([...cart, product])
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(cart.concat(product)))
      }
      

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const index = cart.findIndex(product=>product.id===productId)

      if(index>=0){

        cart.splice(index, 1)
        setCart([...cart])
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(cart))

      }else{
        toast.error('Erro na remoção do produto')
      }
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const product = cart.find(product=>product.id===productId)
      const stockResponse = await api.get(`stock/${productId}`)
      const { amount:stockAmount }:Stock = stockResponse.data

      if(product && (product.amount<stockAmount)){
        product.amount = amount
        setCart([...cart])
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(cart))
      }else if(product && amount<product.amount && amount!==0){
        product.amount = amount
        setCart([...cart])
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(cart))
      }else {
        toast.error('Quantidade solicitada fora de estoque');
      }
      
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
