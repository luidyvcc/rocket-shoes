import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    return storagedCart ? JSON.parse(storagedCart) : [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = cart.slice();
      let index = newCart.findIndex(i => i.id === productId);

      if (index !== -1) {
        const { data: { amount: ProductAmount } } = await api.get(`/stock/${productId}`);
        if (newCart[index].amount + 1 > ProductAmount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        newCart[index].amount += 1;

        console.log('cart[index].amount: ', cart[index].amount);
        console.log('newCart[index].amount: ', newCart[index].amount);
      } else {
        const { data: product} = await api.get(`/products/${productId}`);
        newCart.push({ ...product, amount: 1 });
        index = newCart.findIndex(i => i.id === productId);
      }

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.slice();
      const index = newCart.findIndex(i => i.id === productId);
      if (index === -1) throw Error();
      newCart.splice(index, 1);
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount <= 0) return;
    try {
      const { data: { amount: ProductAmount } } = await api.get(`/stock/${productId}`);
      if (amount > ProductAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = cart.slice();
      const index = newCart.findIndex(i => i.id === productId);

      newCart[index].amount = amount;
      
      newCart.splice(index, 1, newCart[index]);
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
