<el-carousel type="card" height="24vw" indicator-position="none">
  <el-carousel-item v-for="item, k in previewSrcList" :key="item">
    <el-image style="width: 100%; height: 100%" preview-teleported :preview-src-list="previewSrcList" :src="item" :initial-index="k" fit="contain" />
  </el-carousel-item>
</el-carousel>

<script setup>
import { ElCarousel, ElCarouselItem, ElImage, ElImageViewer } from "element-plus"

const previewSrcList = [
  "/screenshot/1.png",
  "/screenshot/2.png",
  "/screenshot/3.png",
  "/screenshot/4.png",
  "/screenshot/5.png",
  "/screenshot/6.png",
  "/screenshot/7.png",
  "/screenshot/8.png",
  "/screenshot/9.png",
  "/screenshot/10.png",
  "/screenshot/11.png",
  "/screenshot/12.png",
  "/screenshot/13.png",
  "/screenshot/14.png",
  "/screenshot/15.png",
  "/screenshot/16.png",
  "/screenshot/17.png",
  "/screenshot/18.png",
  "/screenshot/19.png",
  "/screenshot/20.png",
  "/screenshot/21.png",
  "/screenshot/22.png",
  "/screenshot/23.png",
  "/screenshot/24.png",
  "/screenshot/25.png",
  "/screenshot/26.png",
  "/screenshot/27.png",
]
</script>