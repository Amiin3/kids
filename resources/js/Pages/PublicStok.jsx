import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';

export default function PublicStok({ products, brandName, totalStok }) {
    const [time, setTime] = useState('');
    const [activeTab, setActiveTab] = useState('stok');
    const [searchQuery, setSearchQuery] = useState('');
    const [openCards, setOpenCards] = useState({});

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const toggleCard = (id) => setOpenCards(prev => ({ ...prev, [id]: !prev[id] }));

    const areasData = [
        { prov: 'Banten', kota: 'Kota Tangerang Selatan, Kota Tangerang, Kab. Tangerang, Kab. Pandeglang, Kab. Lebak, Kab. Serang, Kota Serang, Kota Cilegon', area: '2' },
        { prov: 'DI Yogyakarta', kota: 'Kab. Kulon Progo, Kota Yogyakarta, Kab. Sleman, Kab. Bantul, Kab. Gunungkidul', area: '1' },
        { prov: 'DKI Jakarta', kota: 'Kota Jakarta Pusat, Kota Jakarta Selatan, Kota Jakarta Barat, Kota Jakarta Timur, Kota Jakarta Utara', area: '2' },
        { prov: 'DKI Jakarta', kota: 'Kab. Kepulauan Seribu', area: '3' },
        { prov: 'Jawa Barat', kota: 'Kab. Bandung, Kab. Kuningan, Kab. Purwakarta, Kota Bandung', area: '1' },
        { prov: 'Jawa Barat', kota: 'Kab. Bandung Barat, Kota Cimahi, Kab. Cirebon, Kota Cirebon, Kab. Indramayu, Kab. Subang', area: '2' },
        { prov: 'Jawa Barat', kota: 'Kab. Bogor, Kota Bogor, Kota Depok, Kota Bekasi, Kota Banjar, Kab. Ciamis, Kota Tasikmalaya, Kab. Majalengka, Kab. Sumedang, Kab. Bekasi, Kab. Tasikmalaya, Kab. Garut', area: '3' },
        { prov: 'Jawa Barat', kota: 'Kab. Cianjur, Kab. Pangandaran, Kab. Karawang, Kota Sukabumi, Kab. Sukabumi', area: '4' },
        { prov: 'Jawa Tengah', kota: 'Kab. Tegal, Kota Surakarta, Kota Tegal, Kab. Brebes, Kab. Kebumen, Kab. Pemalang, Kota Semarang', area: '2' },
        { prov: 'Jawa Tengah', kota: 'Kab. Boyolali, Kota Salatiga, Kab. Semarang, Kab. Cilacap, Kab. Grobogan, Kab. Kendal, Kab. Rembang', area: '3' },
        { prov: 'Jawa Tengah', kota: 'Kota Pekalongan, Kab. Pekalongan, Kab. Batang, Kab. Purbalingga, Kab. Kudus, Kab. Sukoharjo, Kab. Klaten, Kota Magelang, Kab. Banyumas, Kab. Magelang, Kab. Temanggung, Kab. Sragen, Kab. Banjarnegara, Kab. Karanganyar, Kab. Wonosobo, Kab. Jepara, Kab. Demak, Kab. Purworejo, Kab. Blora, Kab. Wonogiri, Kab. Pati', area: '4' },
        { prov: 'Jawa Timur', kota: 'Kota Probolinggo, Kab. Bangkalan, Kab. Sidoarjo, Kab. Banyuwangi, Kota Surabaya, Kab. Sampang, Kab. Pamekasan, Kab. Pacitan', area: '2' },
        { prov: 'Jawa Timur', kota: 'Kab. Lumajang, Kab. Probolinggo', area: '3' },
        { prov: 'Jawa Timur', kota: 'Kab. Jombang, Kota Blitar, Kab. Blitar, Kab. Kediri, Kab. Lamongan, Kab. Kediri, Kab. Ngawi, Kab. Mojokerto, Kota Mojokerto, Kab. Magetan, Kab. Gresik, Kab. Tulungagung, Kab. Nganjuk, Kab. Pasuruan, Kota Pasuruan, Kab. Bojonegoro, Kab. Madiun, Kab. Bondowoso, Kab. Tuban, Kota Madiun, Kab. Situbondo, Kab. Jember, Kota Malang, Kab. Malang, Kab. Ponorogo, Kota Batu, Kab. Trenggalek', area: '4' },
        { prov: 'Bengkulu', kota: 'Kab. Seluma', area: '3' },
        { prov: 'Bengkulu', kota: 'Kab. Bengkulu Selatan, Kab. Kaur, Kab. Lebong, Kab. Rejang Lebong, Kab. Bengkulu Tengah, Kota Bengkulu, Kab. Bengkulu Utara, Kab. Kepahiang, Kab. Muko Muko', area: '4' },
        { prov: 'Jambi', kota: 'Kab. Batanghari, Kota Jambi, Kab. Tanjung Jabung Barat, Kab. Muaro Jambi, Kab. Sarolangun', area: '3' },
        { prov: 'Jambi', kota: 'Kab. Tanjung Jabung Timur, Kab. Kerinci, Kab. Bungo, Kab. Tebo, Kab. Merangin, Kota Sungai Penuh', area: '4' },
        { prov: 'Kep. Bangka Belitung', kota: 'Kab. Bangka Selatan, Kota Pangkal Pinang, Kab. Belitung, Kab. Belitung Timur', area: '2' },
        { prov: 'Kep. Bangka Belitung', kota: 'Kab. Bangka, Kab. Bangka Tengah, Kab. Bangka Barat', area: '3' },
        { prov: 'Kepulauan Riau', kota: 'Kota Batam', area: '2' },
        { prov: 'Kepulauan Riau', kota: 'Kab. Karimun, Kab. Bintan, Kota Tanjung Pinang', area: '3' },
        { prov: 'Kepulauan Riau', kota: 'Kab. Lingga, Kab. Kepulauan Anambas, Kab. Natuna', area: '4' },
        { prov: 'Lampung', kota: 'Kab. Lampung Tengah, Kab. Pringsewu, Kota Metro, Kab. Pesawaran, Kab. Lampung Selatan, Kota Bandar Lampung', area: '3' },
        { prov: 'Lampung', kota: 'Kab. Lampung Barat, Kab. Lampung Timur, Kab. Tulang Bawang Barat, Kab. Way Kanan, Kab. Tulang Bawang, Kab. Tanggamus, Kab. Pesisir Barat, Kab. Lampung Utara, Kab. Mesuji', area: '4' },
        { prov: 'Aceh', kota: 'Kab. Aceh Barat Daya, Kab. Aceh Besar, Kota Sabang, Kab. Gayo Lues', area: '2' },
        { prov: 'Aceh', kota: 'Kab. Aceh Jaya, Kab. Aceh Selatan, Kab. Aceh Tenggara, Kab. Nagan Raya, Kota Banda Aceh', area: '3' },
        { prov: 'Aceh', kota: 'Kab. Aceh Barat, Kab. Aceh Singkil, Kab. Aceh Tamiang, Kab. Aceh Tengah, Kota Subulussalam, Kab. Bener Meriah, Kab. Aceh Utara, Kota Lhokseumawe, Kab. Pidie, Kab. Aceh Timur, Kab. Simeulue, Kota Langsa, Kab. Bireuen, Kab. Pidie Jaya', area: '4' },
        { prov: 'Riau', kota: 'Kota Pekanbaru', area: '2' },
        { prov: 'Riau', kota: 'Kab. Kuantan Singingi, Kab. Pelalawan, Kab. Kampar, Kab. Siak, Kota Dumai, Kab. Rokan Hilir, Kab. Indragiri Hulu, Kab. Kepulauan Meranti, Kab. Bengkalis', area: '3' },
        { prov: 'Riau', kota: 'Kab. Rokan Hulu, Kab. Indragiri Hilir', area: '4' },
        { prov: 'Sumatera Barat', kota: 'Kab. Kepulauan Mentawai', area: '2' },
        { prov: 'Sumatera Barat', kota: 'Kota Payakumbuh, Kota Padang Panjang, Kab. Sijunjung, Kab. Padang Pariaman, Kab. Padang, Kab. Solok Selatan', area: '3' },
        { prov: 'Sumatera Barat', kota: 'Kab. Pasaman Barat, Kab. Pasaman, Kab. Lima Puluh Kota, Kab. Tanah Datar, Kab. Dharmasraya, Kota Solok, Kab. Agam, Kab. Solok, Kota Bukittinggi, Kota Pariaman, Kota Sawahlunto, Kab. Pesisir Selatan', area: '4' },
        { prov: 'Sumatera Selatan', kota: 'Kab. Ogan Komering Ilir, Kab. Penukal Abab Lematang Ilir, Kab. Banyuasin, Kota Palembang, Kab. Ogan Ilir', area: '3' },
        { prov: 'Sumatera Selatan', kota: 'Kab. Ogan Komering Ulu Timur, Kab. Ogan Komering Ulu Selatan, Kab. Ogan Komering Ulu, Kab. Musi Rawas, Kab. Musi Rawas Utara, Kab. Empat Lawang, Kota Pagar Alam, Kota Lubuk Linggau, Kab. Musi Banyuasin, Kab. Muara Enim, Kab. Lahat, Kota Prabumulih', area: '4' },
        { prov: 'Sumatera Utara', kota: 'Kab. Karo, Kota Medan, Kab. Dairi', area: '2' },
        { prov: 'Sumatera Utara', kota: 'Kota Binjai, Kota Tebing Tinggi, Kab. Serdang Bedagai, Kab. Langkat, Kab. Deli Serdang, Kab. Batu Bara, Kota Tanjung Balai, Kab. Asahan, Kota Gunungsitoli, Kab. Nias Barat, Kab. Nias Selatan, Kab. Nias Utara', area: '3' },
        { prov: 'Sumatera Utara', kota: 'Kab. Pakpak Bharat, Kab. Mandailing Natal, Kab. Padang Lawas, Kab. Labuhanbatu Utara, Kota Padangsidimpuan, Kab. Tapanuli Selatan, Kab. Labuhanbatu Selatan, Kab. Labuhanbatu, Kab. Tapanuli Utara, Kab. Padang Lawas Utara, Kab. Humbang Hasundutan, Kab. Simalungun, Kab. Toba Samosir, Kota Pematangsiantar, Kab. Tapanuli Tengah, Kab. Samosir, Kota Sibolga, Kab. Nias', area: '4' },
        { prov: 'Kalimantan Barat', kota: 'Kab. Sekadau, Kab. Kapuas Hulu, Kab. Sintang, Kab. Bengkayang, Kab. Melawi, Kab. Sambas, Kab. Sanggau, Kab. Kubu Raya, Kota Pontianak, Kab. Kayong Utara, Kab. Landak, Kab. Mempawah, Kota Singkawang, Kab. Ketapang', area: '4' },
        { prov: 'Kalimantan Selatan', kota: 'Kab. Hulu Sungai Tengah, Kab. Tapin, Kab. Hulu Sungai Utara, Kab. Tabalong, Kota Banjarmasin, Kab. Banjar, Kab. Tanah Bumbu, Kota Banjarbaru, Kab. Hulu Sungai Selatan', area: '2' },
        { prov: 'Kalimantan Selatan', kota: 'Kab. Balangan, Kab. Barito Kuala, Kab. Tanah Laut, Kab. Kotabaru', area: '3' },
        { prov: 'Kalimantan Tengah', kota: 'Kab. Kapuas, Kab. Pulang Pisau, Kota Palangkaraya', area: '3' },
        { prov: 'Kalimantan Tengah', kota: 'Kab. Seruyan, Kab. Kotawaringin Barat, Kab. Katingan, Kab. Kotawaringin Timur, Kab. Sukamara, Kab. Lamandau, Kab. Murung Raya, Kab. Barito Timur, Kab. Barito Utara, Kab. Barito Selatan, Kab. Gunung Mas', area: '4' },
        { prov: 'Kalimantan Timur', kota: 'Kab. Penajam Paser Utara, Kota Balikpapan, Kab. Paser, Kab. Kutai Kartanegara, Kota Samarinda, Kota Bontang, Kab. Berau, Kab. Kutai Timur, Kab. Kutai Barat, Kab. Mahakam Ulu', area: '4' },
        { prov: 'Kalimantan Utara', kota: 'Kab. Tana Tidung, Kab. Malinau, Kab. Bulungan, Kota Tarakan, Kab. Nunukan', area: '4' },
        { prov: 'Gorontalo', kota: 'Kab. Pahuwato, Kab. Boalemo, Kab. Gorontalo, Kota Gorontalo, Kab. Gorontalo Utara, Kab. Bone Bolango', area: '4' },
        { prov: 'Sulawesi Barat', kota: 'Kab. Mamuju Tengah', area: '2' },
        { prov: 'Sulawesi Barat', kota: 'Kab. Majene, Kab. Polewali Mandar, Kab. Mamuju Utara', area: '3' },
        { prov: 'Sulawesi Barat', kota: 'Kab. Mamuju, Kab. Mamasa', area: '4' },
        { prov: 'Sulawesi Selatan', kota: 'Kab. Barru, Kota Pare Pare, Kab. Pinrang', area: '2' },
        { prov: 'Sulawesi Selatan', kota: 'Kab. Sinjai, Kab. Enrekang, Kab. Sidenreng Rappang, Kab. Luwu Timur, Kab. Soppeng, Kab. Tana Toraja', area: '3' },
        { prov: 'Sulawesi Selatan', kota: 'Kab. Kepulauan Selayar, Kab. Takalar, Kab. Jeneponto, Kab. Bulukumba, Kab. Pangkajene Kepulauan, Kota Makassar, Kab. Gowa, Kab. Maros, Kab. Bone, Kab. Wajo, Kab. Luwu, Kab. Luwu Utara, Kota Palopo, Kab. Toraja Utara', area: '4' },
        { prov: 'Sulawesi Tengah', kota: 'Kab. Banggai Kepulauan, Kab. Banggai Laut, Kota Palu, Kab. Toli Toli, Kab. Tojo Una Una, Kab. Morowali, Kab. Morowali Utara', area: '3' },
        { prov: 'Sulawesi Tengah', kota: 'Kab. Banggai, Kab. Parigi Moutong, Kab. Donggala, Kab. Sigi, Kab. Poso, Kab. Buol', area: '4' },
        { prov: 'Sulawesi Tenggara', kota: 'Kab. Konawe Kepulauan, Kab. Konawe Utara, Kab. Buton Utara, Kab. Wakatobi', area: '2' },
        { prov: 'Sulawesi Tenggara', kota: 'Kota Bau Bau, Kab. Muna, Kab. Buton Selatan, Kab. Buton Tengah, Kab. Muna Barat', area: '3' },
        { prov: 'Sulawesi Tenggara', kota: 'Kab. Kolaka, Kab. Kolaka Utara, Kab. Konawe, Kab. Konawe Selatan, Kota Kendari, Kab. Kolaka Timur, Kab. Buton, Kab. Bombana', area: '4' },
        { prov: 'Sulawesi Utara', kota: 'Kab. Bolaang Mongondow, Kab. Bolaang Mongondow Selatan, Kota Kotamobagu, Kab. Minahasa Selatan, Kab. Bolaang Mongondow Timur, Kab. Minahasa Tenggara, Kab. Bolaang Mongondow Utara, Kota Tomohon, Kab. Minahasa, Kota Manado, Kab. Minahasa Utara, Kota Bitung, Kab. Kepulauan Sangihe, Kab. Kepulauan Talaud, Kab. Siau Tagulandang Biaro', area: '4' },
        { prov: 'Bali', kota: 'Kab. Jembrana, Kab. Buleleng', area: '1' },
        { prov: 'Bali', kota: 'Kab. Badung, Kab. Karangasem, Kab. Tabanan, Kab. Bangli, Kab. Gianyar, Kab. Klungkung, Kota Denpasar', area: '2' },
        { prov: 'NTB', kota: 'Kab. Lombok Barat, Kab. Lombok Timur, Kota Mataram, Kab. Lombok Tengah, Kab. Lombok Utara, Kab. Sumbawa Barat, Kab. Sumbawa, Kota Bima, Kab. Dompu', area: '2' },
        { prov: 'NTB', kota: 'Kab. Bima', area: '4' },
        { prov: 'NTT', kota: 'Kab. Alor, Kota Kupang, Kab. Kupang, Kab. Malaka, Kab. Manggarai Barat, Kab. Timor Tengah Selatan, Kab. Belu, Kab. Sikka, Kab. Timor Tengah Utara, Kab. Lembata, Kab. Manggarai Timur, Kab. Ende, Kab. Sumba Barat Daya, Kab. Rote Ndao, Kab. Nagekeo, Kab. Flores Timur, Kab. Ngada, Kab. Sumba Tengah, Kab. Manggarai, Kab. Sumba Barat, Kab. Sumba Timur, Kab. Sabu Raijua', area: '4' },
        { prov: 'Maluku', kota: 'Kab. Maluku Tenggara Barat, Kab. Kepulauan Aru, Kota Tual, Kab. Seram Bagian Barat, Kab. Maluku Tengah, Kab. Seram Bagian Timur, Kota Ambon, Kab. Maluku Tenggara, Kab. Maluku Barat Daya, Kab. Buru Selatan, Kab. Buru', area: '1' },
        { prov: 'Maluku Utara', kota: 'Kab. Halmahera Barat, Kab. Halmahera Utara, Kab. Kepulauan Sula, Kab. Halmahera Timur, Kab. Pulau Taliabu, Kab. Halmahera Selatan, Kota Tidore Kepulauan, Kota Ternate, Kab. Halmahera Tengah, Kab. Pulau Morotai', area: '1' },
        { prov: 'Papua', kota: 'Kab. Asmat, Kab. Jayapura, Kab. Mimika, Kab. Keerom, Kab. Biak Numfor, Kota Jayapura, Kab. Kepulauan Yapen, Kab. Boven Digoel, Kab. Merauke, Kab. Deiyai, Kab. Dogiyai, Kab. Intan Jaya, Kab. Jayawijaya, Kab. Lanny Jaya, Kab. Mamberamo Raya, Kab. Mamberamo Tengah, Kab. Mappi, Kab. Nabire, Kab. Nduga, Kab. Paniai, Kab. Pegunungan Bintang, Kab. Puncak, Kab. Puncak Jaya, Kab. Sarmi, Kab. Supiori, Kab. Tolikara, Kab. Waropen, Kab. Yahukimo, Kab. Yalimo', area: '1' },
        { prov: 'Papua Barat', kota: 'Kab. Teluk Bintuni, Kab. Sorong Selatan, Kab. Sorong, Kab. Teluk Wondama, Kota Sorong, Kab. Manokwari, Kab. Fak Fak, Kab. Kaimana, Kab. Manokwari Selatan, Kab. Maybrat, Kab. Pegunungan Arfak, Kab. Raja Ampat, Kab. Tambrauw', area: '1' }
    ];

    const filteredAreas = areasData.filter(item => 
        item.kota.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.prov.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-[480px] mx-auto bg-[#f4f7f6] min-h-screen relative pb-24 shadow-[0_0_20px_rgba(0,0,0,0.05)] text-slate-800 font-sans border-x border-slate-200/60">
            <Head title={`Cek Stok Paket XL - ${brandName}`} />

            {/* HEADER */}
            <header className="bg-white sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                        <i className="fa-solid fa-bolt"></i>
                    </div>
                    <h1 className="font-bold text-[17px] tracking-tight text-slate-800">{brandName}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400">{time}</span>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="bg-[#f4f7f6] min-h-screen">
                
                {/* TAB STOK */}
                {activeTab === 'stok' && (
                    <div className="p-4 space-y-5 animate-[fadeIn_0.3s_ease-in-out]">
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                            <h2 className="font-bold text-lg text-slate-800 leading-tight">Cek Stok Paket XL & AXIS</h2>
                            <p className="text-[11px] text-slate-500 mt-1 mb-4">Pantau ketersediaan paket data secara real-time.</p>
                            
                            <div className="flex justify-between items-end border-t border-slate-100 pt-3">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Stok</p>
                                    <p className="text-3xl font-extrabold text-blue-600 mt-0.5">{new Intl.NumberFormat('id-ID').format(totalStok)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Terakhir diupdate</p>
                                    <p className="text-[11px] font-bold text-slate-700 mt-1 mb-2">{time}</p>
                                    <button onClick={() => window.location.reload()} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ml-auto">
                                        <i className="fa-solid fa-rotate"></i> Refresh Stok
                                    </button>
                                </div>
                            </div>
                        </div>

                        {Object.entries(products).map(([categoryName, items]) => (
                            <div key={categoryName} className="pt-2">
                                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{categoryName}</h2>
                                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-3 mt-0.5">
                                    <span>Produk {categoryName}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span>{items.length} item</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {items.map((p, idx) => {
                                        const isReady = p.stok > 0;
                                        const cardId = `prod_${p.product_code}_${idx}`;
                                        const isOpen = openCards[cardId] || false;

                                        return (
                                            <div key={cardId} className={`bg-white rounded-[14px] shadow-sm border ${isReady ? 'border-green-100' : 'border-slate-100'} flex flex-col relative overflow-hidden transition-all duration-200`}>
                                                <div className="p-3 pb-2">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className="font-bold text-[15px] text-slate-800 tracking-tight leading-none">{p.product_code}</h3>
                                                        {isReady ? (
                                                            <span className="bg-green-100 text-green-600 text-[8px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> READY
                                                            </span>
                                                        ) : (
                                                            <span className="bg-slate-100 text-slate-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded">HABIS</span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Sisa Slot</div>
                                                    <div className={`text-2xl font-black ${isReady ? 'text-slate-800' : 'text-slate-300'} leading-none mb-1`}>
                                                        {p.stok}
                                                    </div>
                                                </div>

                                                {/* SLIM ACTION BUTTONS */}
                                                <div className="mt-auto border-t border-slate-100 grid grid-cols-2 text-[10px] font-bold divide-x divide-slate-100">
                                                    <button onClick={() => toggleCard(cardId)} className={`py-2.5 flex items-center justify-center gap-1 hover:bg-slate-50 transition ${isReady || p.areas.length > 0 ? 'text-slate-600' : 'text-slate-400'}`}>
                                                        <span>{isOpen ? 'Tutup' : 'Detail'}</span>
                                                        <i className={`fa-solid fa-chevron-down text-[8px] transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
                                                    </button>
                                                    <a href="https://milastore.cloud" target="_blank" rel="noreferrer" className={`py-2.5 flex items-center justify-center gap-1 transition ${isReady ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-400 bg-slate-50 pointer-events-none'}`}>
                                                        Beli <i className="fa-solid fa-cart-shopping text-[9px]"></i>
                                                    </a>
                                                </div>

                                                {/* EXPANDABLE AREA DETAILS */}
                                                {isOpen && (
                                                    <div className="bg-slate-50 border-t border-slate-100 px-3 py-2.5 text-xs animate-[fadeIn_0.2s_ease-in-out]">
                                                        {p.areas.length > 0 ? (
                                                            <>
                                                                <div className="space-y-1">
                                                                    {p.areas.map((area, i) => (
                                                                        <div key={i} className="flex justify-between items-center py-1 border-b border-slate-200/60 last:border-0">
                                                                            <span className="text-slate-500 font-semibold text-[10px]">{area.name.toUpperCase()}</span>
                                                                            <span className="font-extrabold text-slate-800 text-[11px]">{area.kuota}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {p.note && (
                                                                    <div className="mt-2 bg-blue-50/50 border border-blue-100 rounded p-1.5 flex gap-1.5 items-start">
                                                                        <i className="fa-solid fa-circle-info text-blue-500 text-[10px] mt-0.5"></i>
                                                                        <p className="text-[9px] text-blue-700 leading-tight font-medium">{p.note}</p>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="text-center text-slate-400 italic text-[10px] py-1">Detail tidak tersedia.</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* FOOTER & KONTAK (ADMIN TELEGRAM @LatsCore & WA) */}
                        <div className="bg-white rounded-2xl p-5 text-center shadow-sm border border-slate-100 mt-8 mb-4 space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm">Order Here!!</h3>
                            <div className="flex justify-center gap-2">
                                <a href="https://t.me/LatsCore" target="_blank" rel="noreferrer" className="flex-1 py-2 bg-sky-50 text-sky-600 font-bold text-[11px] rounded-lg border border-sky-100 flex items-center justify-center gap-1.5">
                                    <i className="fa-brands fa-telegram text-sm"></i> @LatsCore
                                </a>
                                <a href="https://wa.me/62859106609838" target="_blank" rel="noreferrer" className="flex-1 py-2 bg-green-50 text-green-600 font-bold text-[11px] rounded-lg border border-green-100 flex items-center justify-center gap-1.5">
                                    <i className="fa-brands fa-whatsapp text-sm"></i> Admin WA
                                </a>
                            </div>
                            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                                <p>© 2026 {brandName}. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW 2: CEK KUOTA (LINK RESMI) */}
                {activeTab === 'cek' && (
                    <div className="p-4 animate-[fadeIn_0.3s_ease-in-out]">
                        <div className="bg-white p-6 rounded-2xl shadow-sm text-center border border-slate-100 mt-6">
                            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                                <i className="fa-solid fa-sim-card text-2xl"></i>
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg mb-1">Cek Kuota Kartu</h3>
                            <p className="text-xs text-slate-500 mb-5 leading-relaxed">Gunakan layanan resmi pengecekan kuota provider yang terintegrasi dengan sistem kami.</p>
                            <a href="https://milastore.cloud/order/cek-kuota" className="block w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-sm shadow-blue-200">
                                Cek Kuota Sekarang <i className="fa-solid fa-arrow-right ml-1"></i>
                            </a>
                        </div>
                    </div>
                )}

                {/* VIEW 3: DATA AREA */}
                {activeTab === 'area' && (
                    <div className="p-4 space-y-4 animate-[fadeIn_0.3s_ease-in-out]">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                            <h2 className="font-bold text-lg text-slate-800 leading-tight">Cari Area Paket XL</h2>
                            <p className="text-[11px] text-slate-500 mt-1 mb-4">Temukan pembagian wilayah Area 1 - 4.</p>
                            
                            <div className="relative mb-4">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><i className="fa-solid fa-magnifying-glass text-[11px]"></i></span>
                                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari Nama Kota / Kabupaten..." className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition" />
                            </div>

                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wide text-[9px]">
                                            <th className="p-3">Provinsi / Wilayah</th>
                                            <th className="p-3 text-center w-14">Area</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredAreas.length > 0 ? filteredAreas.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="p-3">
                                                    <span className="block font-bold text-slate-800 mb-0.5">{item.prov}</span>
                                                    <span className="block text-[10px] text-slate-500 leading-tight">{item.kota}</span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`font-bold px-2 py-1 rounded text-[10px] ${item.area === '1' ? 'bg-green-50 text-green-600' : (item.area === '2' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600')}`}>
                                                        {item.area}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="2" className="p-4 text-center text-slate-400 italic text-[11px]">Wilayah tidak ditemukan.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* BOTTOM NAVBAR */}
            <nav className="fixed bottom-0 w-full max-w-[480px] bg-white border-t border-slate-100 flex justify-around items-center h-[60px] z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] rounded-t-2xl pb-safe">
                <button onClick={() => { setActiveTab('stok'); window.scrollTo(0,0); }} className={`flex flex-col items-center justify-center w-full h-full gap-1 pt-1 transition ${activeTab === 'stok' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <i className="fa-solid fa-cube text-[16px]"></i>
                    <span className="text-[9px] font-bold">Stok Produk</span>
                </button>
                <button onClick={() => { setActiveTab('cek'); window.scrollTo(0,0); }} className={`flex flex-col items-center justify-center w-full h-full gap-1 pt-1 transition ${activeTab === 'cek' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <i className="fa-solid fa-sim-card text-[16px]"></i>
                    <span className="text-[9px] font-bold">Cek Kuota</span>
                </button>
                <button onClick={() => { setActiveTab('area'); window.scrollTo(0,0); }} className={`flex flex-col items-center justify-center w-full h-full gap-1 pt-1 transition ${activeTab === 'area' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <i className="fa-solid fa-map-location-dot text-[16px]"></i>
                    <span className="text-[9px] font-bold">Data Area</span>
                </button>
            </nav>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
            `}} />
        </div>
    );
}
