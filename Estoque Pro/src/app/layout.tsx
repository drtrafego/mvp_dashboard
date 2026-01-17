import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/providers";
import { WhatsAppButton } from "@/components/whatsapp-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://chefcontrol.online'),
  title: {
    default: 'ChefControl - Sistema de Controle de Estoque para Restaurantes',
    template: '%s | ChefControl'
  },
  description: 'Software completo de gestão de estoque para restaurantes, bares e lanchonetes. Controle de CMV, fichas técnicas, custos de alimentos e inventário em tempo real. Reduza desperdícios e aumente seu lucro.',
  keywords: [
    'controle de estoque restaurante',
    'software para restaurante',
    'sistema de estoque',
    'ficha técnica restaurante',
    'CMV restaurante',
    'custo de alimentos',
    'gestão de estoque',
    'inventário restaurante',
    'software restaurante brasil',
    'controle food cost',
    'sistema para bar',
    'gestão de compras restaurante'
  ],
  authors: [{ name: 'ChefControl' }],
  creator: 'ChefControl',
  publisher: 'ChefControl',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://chefcontrol.online',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://chefcontrol.online',
    siteName: 'ChefControl',
    title: 'ChefControl - Sistema de Controle de Estoque para Restaurantes',
    description: 'Software completo de gestão de estoque para restaurantes. Fichas técnicas, CMV, controle de custos e inventário em tempo real.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ChefControl - Controle de Estoque para Restaurantes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChefControl - Controle de Estoque para Restaurantes',
    description: 'Software completo de gestão de estoque para restaurantes. Fichas técnicas, CMV e controle de custos.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  verification: {
    google: 'adicionar-codigo-google-search-console',
  },
  category: 'Software',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="beforeInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TDFSWG2H');`}
        </Script>

        {/* Meta Pixel */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '510826690272749');
fbq('track', 'PageView');`}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=510826690272749&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TDFSWG2H"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Providers>
          {children}
          <WhatsAppButton />
        </Providers>
      </body>
    </html>
  );
}
