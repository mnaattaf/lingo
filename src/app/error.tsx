'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="center-state"><h1>تعذر فتح الصفحة الآن</h1><p>حاول مجددًا بعد لحظات.</p><button onClick={reset}>إعادة المحاولة</button></main>;}
