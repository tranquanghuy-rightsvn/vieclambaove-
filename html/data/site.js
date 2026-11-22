/* Sinh bởi scripts/build.mjs từ data/site.json – không sửa tay */
(function (V, d) {
  var t = Date.now(), D = 864e5;
  d.jobs = d.jobs.map(function (j) {
    j.posted = Math.max(0, Math.floor((t - j.postedAt) / D));
    j.daysLeft = Math.floor((j.expiresAt - t) / D);
    return j;
  }).filter(function (j) { return j.expiresAt > t; });
  for (var k in d) V[k] = d[k];
})(window.VLBV = window.VLBV || {}, {"provinces":[{"slug":"tp-hcm","name":"TP. Hồ Chí Minh","short":"TP.HCM","districts":["Quận 1","Quận 2 (TP Thủ Đức)","Quận 3","Quận 7","Quận 10","Bình Thạnh","Tân Bình","Gò Vấp","Phú Nhuận","Tân Phú"]},{"slug":"ha-noi","name":"Hà Nội","short":"Hà Nội","districts":["Cầu Giấy","Đống Đa","Hoàn Kiếm","Nam Từ Liêm","Thanh Xuân","Hai Bà Trưng","Long Biên"]},{"slug":"binh-duong","name":"Bình Dương","short":"Bình Dương","districts":["Thuận An","Dĩ An","Thủ Dầu Một","Bến Cát","Tân Uyên"]},{"slug":"dong-nai","name":"Đồng Nai","short":"Đồng Nai","districts":["Biên Hòa","Long Thành","Nhơn Trạch","Trảng Bom"]},{"slug":"bac-ninh","name":"Bắc Ninh","short":"Bắc Ninh","districts":["TP Bắc Ninh","Từ Sơn","Quế Võ","Yên Phong"]},{"slug":"da-nang","name":"Đà Nẵng","short":"Đà Nẵng","districts":["Hải Châu","Sơn Trà","Ngũ Hành Sơn","Liên Chiểu"]}],"targets":[{"id":"toa-nha","name":"Tòa nhà / Chung cư","icon":"building"},{"id":"kcn","name":"Khu công nghiệp / Nhà máy","icon":"factory"},{"id":"ngan-hang","name":"Ngân hàng","icon":"bank"},{"id":"su-kien","name":"Sự kiện","icon":"star"},{"id":"ve-si","name":"Vệ sĩ","icon":"shield"},{"id":"truong-hoc","name":"Trường học / Bệnh viện","icon":"school"}],"shifts":[{"id":"8h","name":"Ca 8 tiếng"},{"id":"12h","name":"Ca 12 tiếng"},{"id":"dem","name":"Ca đêm"},{"id":"gay","name":"Ca gãy"},{"id":"24h","name":"Trực 24h"}],"companies":[],"jobs":[],"videos":[]});
