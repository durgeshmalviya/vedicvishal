import type { Metadata } from "next";
 
const pageSEO = {
  title: "Numerology Calculator | Orionode Tech",
  description:
    "Generate your numerology report including Life Path Number, Destiny Number, Soul Urge Number, and more.",
};

export const metadata: Metadata = pageSEO;
export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[#F6F4EE] py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    {pageSEO.title}<br/>
        {pageSEO.description}
      </div>
    </main>
  );
}