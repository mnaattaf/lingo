import type {Metadata} from 'next';import '@fontsource/noto-sans-arabic/arabic-400.css';import '@fontsource/noto-sans-arabic/arabic-600.css';import '@fontsource/noto-sans-arabic/arabic-700.css';import './globals.css';
export const metadata:Metadata={icons:{icon:'/favicon.svg'},title:'نَبتة | مغامرة صغيرة، تعلّم كبير',description:'رحلة شخصية ممتعة لتعلم الإنجليزية، خطوة بخطوة.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><body>{children}</body></html>;}
