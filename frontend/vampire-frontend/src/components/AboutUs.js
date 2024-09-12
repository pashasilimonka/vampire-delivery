import { useAuth } from "../context/AuthContext";

function AboutUs() {
    const { logout } = useAuth();
    return(
        <div className="container">
        <div className="content-block">
          <h2>Про нас</h2>
          <p>Vampire Delivery Co. - це унікальна служба нічної доставки для вампірів. Ми працюємо тільки вночі, щоб забезпечити вам комфорт і швидкість. Наші фамільяри доставляють свіжі пакетики з червоною рідиною до ваших дверей, навіть якщо на шляху є перешкоди.</p>
        </div>

        <div className="content-block">
          <h2>Наші послуги</h2>
          <p>Ми пропонуємо доставку високоякісної крові прямо до вашого притулку. Ви можете бути впевнені, що наші кур'єри уникатимуть місцевих вовкулак та дотримуються традицій вампірської громади.</p>
        </div>

        <div className="cta">
          <h2>Спробуйте наші послуги!</h2>
          <button onClick={() => alert('Скоро ви отримаєте свою першу доставку!')}>Замовити зараз</button>
        </div>
        <button onClick={()=>logout()}>Вийти</button>
      </div>
    );
}
export default AboutUs;