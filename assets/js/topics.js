// Trang riêng cho các tìm kiếm phổ biến: /viec-lam-bao-ve-<chủ đề> và /viec-lam-bao-ve-<chủ đề>-<tỉnh>
import { V, activeJobs, company } from './core.js';

const has = (j, ...words) => { const t = `${j.title} ${j.desc || ''}`.toLowerCase(); return words.some((w) => t.includes(w)); };

export const TOPICS = [
  { slug: 'chung-cu', name: 'bảo vệ tòa nhà, chung cư', short: 'Bảo vệ chung cư', test: (j) => j.target === 'toa-nha',
    intro: 'Bảo vệ tòa nhà, chung cư là nhóm việc tuyển nhiều nhất: kiểm soát ra vào, trông giữ xe, tuần tra hành lang và hỗ trợ cư dân. Việc nhẹ hơn khu công nghiệp, phù hợp cả người lớn tuổi.' },
  { slug: 'khu-cong-nghiep', name: 'bảo vệ khu công nghiệp, nhà máy', short: 'Bảo vệ nhà máy', test: (j) => j.target === 'kcn',
    intro: 'Bảo vệ nhà máy, khu công nghiệp kiểm soát cổng, xe hàng, kiểm tra tư trang công nhân và tuần tra kho bãi. Nhiều nơi bao ăn ca, có ký túc xá và tăng ca đều.' },
  { slug: 'ngan-hang', name: 'bảo vệ ngân hàng', short: 'Bảo vệ ngân hàng', test: (j) => j.target === 'ngan-hang',
    intro: 'Bảo vệ ngân hàng làm giờ hành chính, môi trường sạch, yêu cầu ngoại hình gọn gàng, thái độ lịch sự và tuân thủ quy trình an ninh chặt chẽ.' },
  { slug: 'truong-hoc-benh-vien', name: 'bảo vệ trường học, bệnh viện', short: 'Bảo vệ trường học, bệnh viện', test: (j) => j.target === 'truong-hoc',
    intro: 'Bảo vệ trường học, bệnh viện giữ trật tự cổng, bãi xe, hướng dẫn phụ huynh, người nhà bệnh nhân. Công việc ổn định, ít di chuyển.' },
  { slug: 'ca-dem', name: 'bảo vệ ca đêm', short: 'Bảo vệ ca đêm', test: (j) => j.shift === 'dem' || has(j, 'ca đêm', 'trực đêm'),
    intro: 'Việc bảo vệ ca đêm thường từ 18h hoặc 22h đến sáng. Theo Bộ luật Lao động 2019, giờ làm từ 22h đến 6h được trả thêm ít nhất 30% so với giờ làm ban ngày.' },
  { slug: 'ca-12-tieng', name: 'bảo vệ ca 12 tiếng', short: 'Bảo vệ ca 12 tiếng', test: (j) => j.shift === '12h' || has(j, '12 tiếng', '12h'),
    intro: 'Ca 12 tiếng giúp tổng thu nhập cao hơn ca 8 tiếng nhờ giờ làm thêm. Khi nhận việc, hãy hỏi rõ cách tính tiền làm thêm và số ngày nghỉ trong tháng.' },
  { slug: 'ca-8-tieng', name: 'bảo vệ ca 8 tiếng', short: 'Bảo vệ ca 8 tiếng', test: (j) => j.shift === '8h' || has(j, '8 tiếng', 'ca 8h'),
    intro: 'Ca 8 tiếng đúng giờ làm việc bình thường theo luật, có thời gian nghỉ ngơi, phù hợp người cần làm lâu dài hoặc muốn làm thêm việc khác.' },
  { slug: 'bao-an-o', name: 'bảo vệ bao ăn ở', short: 'Bảo vệ bao ăn ở', test: (j) => j.housing || j.meals,
    intro: 'Việc bảo vệ bao ăn, bao ở giúp tiết kiệm 1,5 đến 2,5 triệu đồng mỗi tháng, phù hợp người từ tỉnh lên thành phố tìm việc.' },
  { slug: 'luong-cao', name: 'bảo vệ lương cao (từ 10 triệu)', short: 'Bảo vệ lương cao', test: (j) => j.salaryMax >= 10,
    intro: 'Các việc bảo vệ có mức lương từ 10 triệu đồng/tháng trở lên, thường là ca 12 tiếng, chỉ huy mục tiêu hoặc mục tiêu yêu cầu cao. Hãy hỏi rõ lương cơ bản và phần làm thêm.' },
  { slug: 'tuyen-gap', name: 'bảo vệ tuyển gấp', short: 'Bảo vệ tuyển gấp', test: (j) => j.urgent || has(j, 'gấp'),
    intro: 'Các vị trí cần người ngay, thường nhận việc trong 1 đến 3 ngày. Dù gấp, công ty hợp pháp không thu tiền đồng phục hay phí hồ sơ.' },
  { slug: 'khong-can-kinh-nghiem', name: 'bảo vệ không cần kinh nghiệm', short: 'Không cần kinh nghiệm', test: (j) => has(j, 'không cần kinh nghiệm', 'chưa có kinh nghiệm', 'đào tạo'),
    intro: 'Việc bảo vệ nhận người mới, được đào tạo nghiệp vụ trước khi nhận mục tiêu. Phù hợp người lần đầu làm nghề bảo vệ.' },
  { slug: 'noi-bo', name: 'bảo vệ nội bộ', short: 'Bảo vệ nội bộ', test: (j) => has(j, 'nội bộ'),
    intro: 'Bảo vệ nội bộ làm trực tiếp cho doanh nghiệp, tòa nhà hay nhà máy, không qua công ty dịch vụ bảo vệ. Thường được ký hợp đồng và đóng bảo hiểm trực tiếp với đơn vị sử dụng.' },
  { slug: 'giu-xe', name: 'bảo vệ giữ xe, trông xe', short: 'Bảo vệ giữ xe', test: (j) => has(j, 'giữ xe', 'trông xe', 'bãi xe'),
    intro: 'Bảo vệ giữ xe kiểm soát vé xe, sắp xếp bãi, trông giữ tài sản tại chung cư, siêu thị, bệnh viện. Công việc đứng chỗ, ít di chuyển, phù hợp người lớn tuổi.' },
  { slug: 'sieu-thi', name: 'bảo vệ siêu thị, cửa hàng', short: 'Bảo vệ siêu thị', test: (j) => has(j, 'siêu thị', 'cửa hàng', 'trung tâm thương mại'),
    intro: 'Bảo vệ siêu thị, cửa hàng, trung tâm thương mại giữ an ninh khu bán hàng, kiểm soát hàng hóa ra vào, hỗ trợ khách và trông xe. Thường chia ca theo giờ mở cửa.' },
  { slug: 'thoi-vu', name: 'bảo vệ thời vụ, làm Tết', short: 'Bảo vệ thời vụ', test: (j) => has(j, 'thời vụ', 'part time', 'bán thời gian', 'làm tết', 'trực tết'),
    intro: 'Việc bảo vệ thời vụ làm theo đợt: dịp Tết, mùa cao điểm, sự kiện. Thời gian ngắn, thường trả lương theo ngày hoặc theo tuần, phù hợp người muốn kiếm thêm.' },
  { slug: 'lon-tuoi', name: 'bảo vệ nhận người lớn tuổi (trên 50)', short: 'Bảo vệ lớn tuổi', test: (j) => Math.max(0, ...(String(j.age || '').match(/\d+/g) || []).map(Number)) >= 55 || has(j, 'lớn tuổi', 'trung niên'),
    intro: 'Các việc bảo vệ nhận người từ 50 tuổi trở lên: thường là bảo vệ tòa nhà, chung cư, giữ xe, trường học, công việc nhẹ và ổn định. Hãy hỏi rõ yêu cầu sức khỏe khi nhận việc.' },
  { slug: 'su-kien', name: 'bảo vệ sự kiện', short: 'Bảo vệ sự kiện', test: (j) => j.target === 'su-kien' || has(j, 'sự kiện'),
    intro: 'Bảo vệ sự kiện làm theo buổi hoặc theo ngày tại hội chợ, triển lãm, ca nhạc. Phù hợp người muốn làm thêm cuối tuần, thường trả lương theo ngày.' },
  { slug: 've-si', name: 'vệ sĩ', short: 'Vệ sĩ', test: (j) => j.target === 've-si' || has(j, 'vệ sĩ'),
    intro: 'Vệ sĩ bảo vệ yếu nhân, áp tải hàng hóa, đòi hỏi thể lực tốt, có võ thuật và kỹ năng xử lý tình huống. Lương cao hơn bảo vệ mục tiêu thông thường.' }
];

const MIN_JOBS = 2; // trang tỉnh + chủ đề chỉ dựng tĩnh khi có từ 2 tin
export const topicPath = (t, pv) => `/viec-lam-bao-ve-${t.slug}${pv ? '-' + pv.slug : ''}`;
export const topicJobs = (t, pv) => activeJobs().filter((j) => t.test(j) && (!pv || j.province === pv.slug));

export function parseTopic(rest) {
  for (const t of TOPICS) {
    if (rest === t.slug) return { t, pv: null };
    if (rest.startsWith(t.slug + '-')) { const pv = V.provinces.find((p) => p.slug === rest.slice(t.slug.length + 1)); if (pv) return { t, pv }; }
  }
  return null;
}

// Các trang có tin (để dựng tĩnh, sitemap, link "Tìm kiếm nhiều")
export function topicPages() {
  const out = [];
  TOPICS.forEach((t) => {
    const n = topicJobs(t).length;
    if (n) out.push({ t, pv: null, n });
    V.provinces.forEach((pv) => { const m = topicJobs(t, pv).length; if (m >= MIN_JOBS) out.push({ t, pv, n: m }); });
  });
  return out;
}

export const topicTitle = (t, pv) => `Việc làm ${t.name}${pv ? ' tại ' + pv.name : ''}`;
export const companyName = (j) => (company(j.company) || {}).name || '';
