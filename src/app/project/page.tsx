import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Blocks, CheckCircle2, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { CONTRACT_ADDRESS, CONTRACT_LINK } from "@/config/contract";

export const metadata: Metadata = {
  title: "О проекте",
  description: "Принцип работы, прозрачность и техническая архитектура Seren Lottery Chain.",
};

export default function ProjectPage() {
  return (
    <main className="project-page">
      <header className="project-page-header">
        <Link href="/#how" className="project-back"><ArrowLeft /> На главную</Link>
        <Link href="/" className="project-logo" aria-label="Seren Lottery Chain">
          <Image src="/assets/logo.png" width={56} height={56} alt="" />
          <span>Seren Lottery Chain</span>
        </Link>
        <Link className="outline-button" href={CONTRACT_LINK} target="_blank">Контракт <ExternalLink size={15} /></Link>
      </header>

      <section className="project-hero">
        <span className="section-kicker">POLYGON · CHAINLINK VRF · SMART CONTRACT</span>
        <h1>Лотерея, правила которой можно проверить в блокчейне</h1>
        <p>Seren Lottery Chain объединяет понятную механику участия с проверяемым смарт-контрактом. Сайт помогает подключить кошелек, увидеть состояние раунда и отправить транзакцию, но не подменяет собой логику контракта.</p>
      </section>

      <section className="architecture-grid">
        <article className="architecture-card"><Blocks /><h2>Общий пул</h2><p>Каждый билет стоит 30 POL. Средства поступают в общий пул текущего раунда, а его состояние читается непосредственно из контракта.</p></article>
        <article className="architecture-card"><Sparkles /><h2>Случайный выбор</h2><p>После завершения набора участников Chainlink VRF предоставляет проверяемую случайность для выбора победителя.</p></article>
        <article className="architecture-card"><ShieldCheck /><h2>Автоматическая выплата</h2><p>90% сформированного пула предназначено победителю и отправляется по правилам смарт-контракта. Результат можно проверить в PolygonScan.</p></article>
      </section>

      <section className="project-detail panel">
        <div>
          <span className="section-kicker">ПУТЬ УЧАСТНИКА</span>
          <h2>От подключения до результата</h2>
        </div>
        <ol>
          <li><CheckCircle2 /><span><strong>Подключение</strong>Кошелек подтверждает доступ к публичному адресу и переключается на Polygon Mainnet.</span></li>
          <li><CheckCircle2 /><span><strong>Проверка</strong>Интерфейс читает цену билета, номер раунда, пул, количество билетов и состояние продаж.</span></li>
          <li><CheckCircle2 /><span><strong>Покупка</strong>Пользователь подтверждает одну транзакцию покупки билета за 30 POL плюс сетевую комиссию.</span></li>
          <li><CheckCircle2 /><span><strong>Розыгрыш</strong>Когда условия раунда выполнены, победитель определяется с использованием Chainlink VRF.</span></li>
          <li><CheckCircle2 /><span><strong>Проверяемый итог</strong>Транзакции и события контракта остаются публичными в блокчейне Polygon.</span></li>
        </ol>
      </section>

      <section className="contract-callout">
        <div><span>Адрес контракта</span><code>{CONTRACT_ADDRESS}</code></div>
        <Link className="primary-button" href={CONTRACT_LINK} target="_blank">Проверить в PolygonScan <ExternalLink size={16} /></Link>
      </section>

      <section className="project-risk panel">
        <h2>Важно понимать риск</h2>
        <p>Лотерея не гарантирует доход. POL, потраченные на билет, могут быть потеряны. Участвуйте только на сумму, которую готовы потерять, и только там, где это разрешено применимым законодательством.</p>
      </section>
    </main>
  );
}
