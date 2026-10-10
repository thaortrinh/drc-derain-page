## DRC-Derain: Detect-Restore-Compose Framework for Unpaired Single-Image Deraining

b,2

a,∗,1,

a, , , , ,

b, , , , ,

## ART I CLE I NFO

Keywords:

## ABSTRACT

Unpaired single-image deraining avoids the need for aligned rainy-clean pairs, but existing translation- based formulations remain highly underconstrained because the generator is typically allowed to reconstruct the entire image. This is unnecessary for rain removal, where degradation usually affects only a subset of the scene, and may lead to unwanted modifications of reliable background content. We propose DRC-Derain, a Detect-Restore-Compose framework that reformulates unpaired deraining as localized image editing. A frequency-aware detector first estimates the rain support by combining weak photometric anchors, learnable spectral evidence, and spatial contextual reasoning. The restoration network then predicts content only for the detected regions, while rain-free pixels are preserved directly from the input through mask-guided composition. To learn this formulation without paired supervision, the same predicted support is reused in a mask-guided reverse mapping, restricting rain synthesis to the supplied region and turning cycle reconstruction into an additional localization signal. Historical predicted masks are further replayed on unrelated clean images to generate controlled synthetic rain. Since the initial photometric prior is imperfect, we employ adaptive weak-mask supervision that adjusts its influence according to degradation-aware restoration quality rather than treating it as fixed pseudo-ground truth. Experiments on synthetic and real-world benchmarks demonstrate that DRC-Derain achieves competitive deraining performance while better preserving unaffected image content and improving robustness under unpaired training.

is reconstructed, but still formulate deraining as global im- age translation. In contrast, our proposed approach makes the estimated rain support an explicit spatial constraint: it determines where restoration is permitted, preserves reliable regions directly from the input, and is reused to constrain reverse rain synthesis during unpaired learning.

Based on this principle, we propose DRC-Derain, a Detect-Restore-Compose framework for unpaired single- image deraining. A frequency-aware detector first estimates the rain support fromweak photometric, spectral, and spatial cues. The restoration network then predicts content only for the detected regions, while the final image is composed with unchanged background pixels from the input. Thus, the predicted mask is not merely an attention cue, but the spatial interface that determines where image editing is permitted.

To learn this formulation without paired supervision, we further reuse the same rain support in a mask-guided reverse mapping. Rain can be re-synthesized only inside the supplied support, so cycle reconstruction also provides localization feedback when the predicted mask misses true rain regions. Historical masks estimated from real rainy im- ages are additionally replayed on unrelated clean images to generate controlled synthetic degradations. Since the initial photometric prior is imperfect, we use it only as an adaptive bootstrap teacher whose influence is adjusted according to degradation-aware restoration quality.

Our contributions are summarized as follows.

- We propose DRC-Derain, which reformulates un- paired deraining as localized detect-restore-compose processing, preserving reliable background content

## 1. Introduction

Rain severely degrades image visibility and can com- promise downstream vision tasks such as detection, recog- nition, and semantic segmentation. Single-image deraining therefore remains an important low-level vision problem [1– 8]. Supervised deraining methods [3, 9–15] have achieved strong performance on synthetic benchmarks, but their de- pendence on aligned rainy-clean pairs limits real-world de- ployment. Such pairs are difficult to acquire, and models trained on synthetic rain often generalize poorly to natural degradations [3, 16]. Unpaired learning alleviates this data requirement, but introduces a different ambiguity: conven- tional image-to-image translation allows the generator to modify the entire image even though rain typically affects only part of the scene. [URL 🔗](#page-0)

This global formulation creates an unnecessary recon- struction burden. The generator must remove rain while simultaneously reproducing background regions that are already reliable, and feature shortcuts used for preservation may also transmit rain-correlated responses. Moreover, an image-only cycle constrains reconstruction without explic- itly specifying where the removed degradation originally occurred. This motivates a localized formulation in which rain support is estimated first, only corrupted regions are restored, and reliable content is preserved directly from the input. Most existing approaches improve how a clean image

( ); ( )

( ); ( ) [URL 🔗](#page-0)

ORCID(s): [URL 🔗](#page-0)

1


by construction rather than reconstructing the entire image.

- We develop a frequency-aware rain detector that for- mulates weak photometric anchors, spectral evidence, and spatial reasoning to estimate rain support without pixel-level annotations.

- We introduce a mask-guided bidirectional learning strategy with adaptive weak-mask supervision, where the detected support constrains reverse rain synthesis and provides cycle-driven localization feedback.

## 2. Related Work

Existing deep learning-based single-image deraining (SID) methods can be broadly grouped into fully supervised, semi-supervised, and unsupervised approaches according to the level of training supervision [17]. [URL 🔗](#page-0)

Supervised Single-Image Deraining. Most SID methods

are trained with paired rainy-clean images and therefore rely heavily on synthetic datasets [3, 9, 10, 14, 15, 18–25]. Early CNN-based methods such as DerainNet [3] learned to sepa- rate rain from background content, while later approaches in- troduced pixel-wise degradation estimation and information decoupling [15], as well as unified restoration for coupled low-light and rain degradation [26]. Subsequent progress spans CNNs, Transformers, recurrent refinement, generative models, frequency-aware and implicit restoration [19, 27], and more recent state-space architectures for long-range modeling [28, 29]. Despite strong benchmark performance, these methods remain dependent on high-quality paired data and can generalize poorly when real rain deviates from the synthetic training distribution. [URL 🔗](#page-0)

Semi-Supervised Single-Image Deraining.

ods in this approach aim to reduce the synthetic-to-real gap by combining paired synthetic data with unlabeled real rainy images [30–34]. Wei et al. [31] transfer shared net- work knowledge from synthetic to real rain, while Yasarla et al. [33] employ Gaussian-process-based priors to ex- ploit limited synthetic supervision together with unlabeled real data. Related work further combines semi-supervised learning with knowledge distillation and directional rain regularization [35]. Although these strategies improve real- scene adaptation, they still retain some dependence on paired supervision. [URL 🔗](#page-0)

Unsupervised Single-Image Deraining. Unsupervised

deraining removes this dependency by learning from in- dependent rainy and clean domains [32, 36–39]. Derain- CycleGAN [32] extends CycleGAN [40] to joint rain gen- eration and removal, while DCD-GAN [36] introduces dual contrastive learning to constrain unpaired translation. NLCL [39] further exploits non-local contrastive relations to distinguish rain from background structure, whereas CSUD [41] combines channel-consistency priors and self- reconstruction to form pseudo-paired supervision. Other [URL 🔗](#page-0)

The meth-

directions include self-supervised reinforcement learning in SRL-Derain [42] and VLM-guided self-reinforcement in RGSUD [43]. These methods reduce the need for paired data, but most still treat deraining primarily as full-image translation or representation alignment, without explicitly using rain support to constrain both forward restoration and reverse synthesis. [URL 🔗](#page-0)

Recent work has also explored more adaptive restoration paradigms. Derain-Agent [44] combines a planning net- work with spatially adaptive strength modulation to sched- ule restoration tools according to residual artifacts. Uni- Rain [45], in contrast, targets multiple rain degradations and scenes through retrieval-augmented dataset distillation and an asymmetric mixture-of-experts architecture. These devel- opments improve adaptability and task coverage, but do not directly address the localized reconstruction ambiguity that arises in unpaired deraining. [URL 🔗](#page-0)

In contrast to the above directions, our proposed DRC- Derain treats rain support as an explicit spatial variable throughout the learning process. The detected support de- termines where restoration is performed, preserves reliable background content through composition, and is reused to constrain reverse rain synthesis. This formulation shifts un- paired deraining from unrestricted full-image translation toward localized detect-restore-compose learning.

## 3. Methodology

## 3.1. Problem Formulation and System Overview

We consider single-image deraining in a fully unpaired setting. Let 𝑟 and 𝑐 denote the domains of real rainy and clean images, respectively. During training, a rainy image 𝑥 ∼ 𝑟 and an unrelated clean image 𝑦 ∼ 𝑐 are sampled independently, so 𝑦 is not the clean counterpart of 𝑥. No aligned rainy-clean pairs, rain-layer annotations, or ground- truth rain masks are required.

The main challenge in this setting is that conventional unpaired translation leaves the generator free to modify the entire image, although rain typically affects only a localized portion of the scene. The network must therefore learn not only to remove rain, but also to reconstruct background regions that are already reliable. Moreover, an image-only cycle provides no explicit indication of where the removed degradation originally occurred, making it possible for the forward and reverse mappings to satisfy cycle reconstruction without learning a precise rain support.

To reduce this ambiguity, we explicitly introduce rain lo- calization into the translation process and formulate derain- ing as a localized detect-restore-compose problem. Based on this principle, we propose Detect-Restore-Compose Derain framework (DRC-Derain), consisting of a rain-removal gen- erator 𝐆𝐴, a mask-guided rain-synthesis generator 𝐆𝐵, and two domain-specific discriminators. The predicted rain mask is not treated as an auxiliary attention cue; instead, it acts as the spatial variable that determines where restoration is permitted and where rain may be reintroduced by the reverse mapping.


*Figure 1: Overview the pipeline of our DRC-Derain framework*

We visualize the pipeline of our DRC-Derain in Fig. 1. The rainy cycle first uses 𝐆𝐴 to jointly recover a derained image and estimate its rain support. Only the detected re- gions are delegated to the restoration network, while reliable background pixels are preserved directly from the input. The same predicted support is then routed to 𝐆𝐵 to reconstruct the rainy observation. Because 𝐆𝐵 is restricted to synthe- sizing rain inside the supplied support, the reverse mapping also provides localization feedback: rain missed by the mask cannot be reconstructed at the correct location. The clean cycle complements this process by reusing historical masks predicted from real rainy images. A mask sampled from the replay pool is combined with an unrelated clean image to synthesize a rainy sample, which is then passed through the same 𝐆𝐴 to recover the original clean content. In this way, the two cycles are coupled not only through shared generators but also through the rain-mask pathway: the rainy cycle learns where rain occurs, while the clean cycle reuses those learned spatial patterns to create controlled synthetic degradation. [URL 🔗](#page-0)

During training, the same 𝐆𝐴 and 𝐆𝐵 are reused in both cycles, whereas the clean- and rainy-domain discriminators remain independent. At inference time, the reverse genera- tor and both discriminators are discarded, and only 𝐆𝐴 is retained for end-to-end deraining.

## 3.2. Frequency-Aware Rain Detection

The first stage of DRC-Derain is to determine where restoration is required. Unlike conventional deraining net- works that process the entire image uniformly, our formu- lation explicitly estimates the spatial support of rain before reconstruction. Given a rainy image 𝑥, the detector 𝑟 predicts a raw rain-probability mask 𝑎 = 𝑟(𝑥), which is subsequently converted into a soft editing support for localized restoration. The raw mask is also retained for weak supervision and mask-guided bidirectional learning.

Rain localization is challenging in the unpaired setting because no ground-truth rain mask or aligned clean target is available. Moreover, appearance alone is ambiguous: bright edges, reflections, and thin scene structures may resemble

*Figure 2: Enter Caption*

rain, whereas low-contrast streaks can be difficult to dis- tinguish from background texture. We therefore combine three complementary cues: a weak photometric bootstrap, learnable frequency-domain evidence, and spatial contextual reasoning.

In the absence of pixel-level supervision, we seek a sim- ple local cue that can provide high-confidence initialization without committing the model to a fixed rain mask. Visible rain streaks can produce local intensity deviations relative to their surrounding neighborhoods, making neighborhood contrast a useful weak signal for bootstrapping localization. We first derive conservative positive and negative anchors from the local photometric behavior of rain. Let  denote the reliable positive anchor set, containing pixels that are likely to belong to rain, and let  denote the reliable negative anchor set, containing pixels that are likely to be rain-free. For each pixel 𝑝, five 7 × 7 windows are considered: one centered at 𝑝 and four having 𝑝 at a corner. Let 𝑥𝑐 (𝑝) denote the intensity at pixel 𝑝 in channel 𝑐 ∈ {𝑅, 𝐺, 𝐵}, and let 𝜇(𝑐) 𝑘 (𝑝) denote the mean intensity of the 𝑘-th window in channel 𝑐. The two anchor sets are defined as:

where 𝜖 = 1.5∕255 for images normalized to [0, 1]. Pixels in  provide weak positive cues for likely rain locations, whereas pixels in  provide reliable non-rain anchors. These sets are used only as an initial localization bias rather than as pseudo-ground-truth masks, since the photometric criterion may activate bright non-rain structures and miss faint streaks. Their influence is therefore adaptively regu- lated during training.


Appearance-based cues alone are insufficient to distin- guish rain from structurally similar background patterns. We therefore complement them with frequency-domain ev- idence. A shallow feature representation of 𝑥 is transformed into the frequency domain using a 2-D real Fourier transform (rFFT2). Then, its log-amplitude spectrum is normalized by removing the dominant radial frequency distribution:

Here, dial distance of frequency bin 𝐴log = log(1 + |𝐹|), 𝑟(𝑢, 𝑣) (𝑢, 𝑣) denotes the quantized ra- from the zero-frequency (DC) component, and Ω𝑟 contains all bins assigned to radius 𝑟.

To preserve the location of each frequency bin after whitening, the response is augmented with the normalized radius and axial orientation encoding, 𝑍 = [ ̃𝐴, 𝜌, cos 2𝜃, sin 2𝜃]. A lightweight learnable gate then selects rain-sensitive frequency responses:

𝐵 = 𝜎 ( 1 𝑜 [ DW3 ( GELU ( 1 𝑖 (𝑍) ))]) .

The final gating layer is initialized conservatively so that only weak spectral responses are selected at the beginning of training. The gate is applied to the original complex spectrum rather than to the whitened amplitude, and the selected signal is projected back into the spatial domain:

𝑒 (|irFFT2(𝐵 ⊙ 𝐹)|) .

The resulting tensor  represents rain-sensitive evi- dence, but is not itself treated as a mask. Frequency re- sponses may still be triggered by background structures with similar orientation, so the evidence must be interpreted jointly with spatial appearance. We therefore fuse  with the rainy input using a convolutional recurrent unit:

𝑎 = 𝜎 ( 3 𝑚(ℎ𝑇) ) .

ℎ𝑡 = ConvGRU [; ( 𝑥], ℎ𝑡−1 ) ,

The recurrent state promotes spatially coherent rain re- sponses while suppressing isolated frequency activations that are inconsistent with their surrounding context.

Finally, the raw prediction is converted into the soft support used by the subsequent restore-and-compose stage:

where 𝛿𝑘(⋅) denotes dilation and 𝑔𝜎𝑏 is a Gaussian kernel. Dilation enlarges the support around thin streak cores, while smoothing avoids abrupt compositing boundaries.

Importantly, 𝐴 is not used merely as an attention map. It defines the spatial interface between detection and restora- tion: pixels outside the predicted support are preserved di- rectly from the rainy input, whereas only the supported regions are delegated to the restoration network. The raw mask 𝑎 is further reused by the reverse synthesis process, allowing the same detected support to constrain bidirectional learning.

Authors :

Preprint submitted to Elsevier

## 3.3. Localized Restore-and-Compose

Once the rain support has been detected, the next ques- tion is how to restore the corrupted content without unnec- essarily reconstructing the rest of the scene. A conventional full-image generator must learn two tasks simultaneously: removing rain from degraded regions and reproducing back- ground content that is already reliable. In addition, high- resolution skip connections commonly used to preserve fine details may also transmit rain-correlated shallow features directly to the decoder, causing residual streaks to reappear in the output.

DRC-Derain instead treats restoration as a

editing

in Sec. ??. The restoration network receives the rainy image together with this support and predicts a restored candidate

where  is a compact encoder–bottleneck–decoder. The en- coder gradually enlarges the receptive field to recover struc- tures obscured by rain, while two Hybrid CNN–Transformer (HBCT) blocks at the bottleneck combine local texture mod- eling with broader contextual reasoning. Rather than retain- ing a complete U-Net skip hierarchy, we keep only the skip connection nearest to the bottleneck. This preserves useful intermediate structure while reducing the direct propagation of rain-contaminated high-resolution features.

Importantly, ̃𝑥 is not taken as the final derained image. Instead, the detected support determines where the restored candidate is allowed to replace the input:

This composition establishes an explicit separation between restoration and preservation. Pixels outside the detected support are copied directly from the rainy input, whereas the network prediction contributes only where restoration is required. In particular, 𝐴(𝑝) = 0 ⟹ ̂𝑥(𝑝) = 𝑥(𝑝), so reliable background content is preserved by construction rather than being reconstructed through feature shortcuts or enforced solely by a content-preservation loss.

The soft support is also important near rain boundaries. Hard binary replacement would make the final image sen- sitive to small localization errors and may introduce abrupt transitions around thin streaks. The feathered mask there- fore allows the restored candidate and the original content to vary smoothly across uncertain boundary regions while still restricting substantial modifications to the detected rain support.

This restore-and-compose formulation changes the role of the generator: instead of synthesizing an entirely new clean image,  only needs to infer plausible content for regions identified as degraded. The resulting derained image 𝑥̂ and the underlying raw support 𝑎 are subsequently reused by the reverse rain-synthesis mapping, which turns the same localization estimate into a constraint for bidirectional un- paired learning.

localized

problem. Let 𝐴 denote the soft rain support estimated


## 3.4. Mask-Guided Bidirectional Learning

The detect–restore–compose formulation defines how a rainy image is converted into a derained result. The remain- ing challenge is how to learn this mapping without paired supervision. We address this by reusing the detected rain support to constrain the reverse translation, so that rain removal and rain synthesis are coupled through the same spatial variable.

Given a clean background 𝑦 and a raw rain mask 𝑀, the reverse generator 𝐺𝐵 first converts 𝑀 into a soft support 𝐴𝑀 = 𝑚(𝑀) and predicts a rainy candidate ̃𝑦𝑟. The syn- thesized image is obtained by the same locality-preserving composition used in the forward direction:

Thus, 𝐺𝐵 can introduce rain only inside the supplied sup- port, while the background outside the mask is preserved directly from 𝑦.

This constrained reverse mapping enables the rainy cycle to provide localization feedback. For a real rainy input, 𝐺𝐴 produces the derained result ̂𝑥 together with the raw rain

mask 𝑎, and the same mask is explicitly reused by

Unlike an image-only cycle, the reverse generator does not need to infer where the removed rain was located. More importantly, if 𝑎 misses a true rain region, 𝐺𝐵 is structurally prevented from reconstructing rain outside the predicted support. The resulting cycle error therefore provides an additional signal for refining the detector.

The complementary clean cycle reuses rain layouts learned from real rainy images. Raw masks predicted in previous rainy batches are stored in a historical mask pool 𝑀. A sampled mask 𝑀 ∼ 𝑀 is combined with an unrelated clean image to generate a synthetic rainy sample, which is then processed by the same removal generator:

The mask pool therefore transfers realistic rain-support pat- terns from the rainy domain to clean images without requir- ing paired observations.

Together, the two cycles form a mask-guided bidirec- tional learning strategy. The rainy cycle uses the predicted support to constrain reverse reconstruction and refine local- ization, whereas the clean cycle reuses historical supports to create controlled synthetic degradation. Both cycles share the same 𝐺𝐴 and 𝐺𝐵, and are coupled through the rain-mask pathway rather than learned as independent translations.

𝐺𝐵:

## 3.5. Learning Objectives

DRC-Derain is trained without aligned rainy–clean pairs or ground-truth rain masks. The optimization must there- fore jointly learn cross-domain translation, preserve scene

content, and prevent the predicted rain support from col- lapsing to trivial solutions. We combine adversarial, cycle- consistency, identity, mask-guidance, and semantic objec- tives:

Domain and cycle constraints. Two domain discrim- inators are used during training. The clean-domain dis- criminator 𝐷𝐴 distinguishes the derained output ̂𝑥 from real clean images, whereas the rainy-domain discriminator 𝐷𝐵 evaluates synthesized rainy samples 𝑦𝑟 and rainy-cycle reconstructions ̄𝑥 against real rainy images. The adversarial objective is

Cycle consistency further preserves the source content

in both directions:

2 ‖ ̄𝑥 − 𝑥‖1 + 2 ‖ ̄𝑦 − 𝑦‖1.

The rainy-cycle term has an additional role in DRC-Derain.

Because ̄𝑥 = 𝐺𝐵( ̂𝑥, 𝑎) and 𝐺𝐵 can synthesize rain only inside the predicted support, missed rain cannot be recon- structed outside 𝑎. Since the mask is not detached, the reconstruction error propagates back to the detector, pro- viding localization supervision in addition to ordinary cycle reconstruction.

Adaptive mask supervision. Localized restoration is effective only when the predicted support is neither trivially closed nor excessively broad. A nearly empty mask reduces the model toward input copying and leaves rain untreated, whereas an overly open mask removes the intended locality constraint and approaches full-image reconstruction. We therefore bootstrap the raw mask 𝑎 using the positive and negative photometric anchors

where WBCE(⋅) denotes a weighted binary cross-entropy over the positive and negative anchor sets, with 𝛽 balancing the negative anchors.

The photometric prior is intentionally treated as a weak bootstrap teacher rather than a fixed pseudo-ground truth, since it can activate bright non-rain structures and miss faint streaks. We therefore adapt its influence according to the quality of the restoration induced by the prior mask relative to that produced by the learned mask. Let 𝑥𝑀5 denote the output obtained using the feathered five-window prior mask while keeping the same restored candidate ̃𝑥. A frozen degradation-aware vision–language encoder measures the remaining rain probability 𝑝𝑟(⋅):


where 𝑤̄𝑡 = 𝛼𝑤̄𝑡−1 +(1−𝛼)𝑤𝑡 is an exponential moving av- erage. When the prior-guided restoration contains less resid- ual rain, its supervision is strengthened; once the learned support becomes more reliable, the guide is automatically attenuated.

Identity and semantic preservation. The forward gen- erator should leave an already clean image unchanged and keep the detector inactive. For a clean input ( ̂𝑦idt , 𝑎idt ) = 𝐺𝐴(𝑦), we use

The first term discourages unnecessary appearance changes, while the second suppresses false rain detections on clean images. No symmetric identity term is required for 𝐺𝐵, since its masked composition satisfies 𝐺𝐵(𝑦, 𝟎) = 𝑦 by construction.

Finally, pixel-space reconstruction does not explicitly measure scene-level semantic drift or residual degradation. We therefore use a frozen vision–language representation Γ(⋅) to preserve semantic consistency across each cycle, together with the degradation-aware rain probability applied to ̂𝑥:

where con is evaluated symmetrically for the rainy and clean cycles in the frozen embedding space.

Together, these objectives supervise complementary as- pects of DRC-Derain. Adversarial learning aligns the clean and rainy domains; the mask-conditioned cycle preserves content while feeding localization errors back to the detec- tor; adaptive weak supervision stabilizes rain support esti- mation without fixing it to an imperfect prior; and identity and semantic constraints suppress unnecessary edits and residual degradation.

## 4. Experimental Results

## 4.1. Implementation Details

All experiments were implemented in PyTorch and con- ducted on a single NVIDIARTXPRO6000GPU. OurDRC- Derain was trained with 800 epochs in total, consisting of 400 epochs with the initial learning rate followed by another 400 epochs with a gradually decayed learning rate. The training direction was set from the rainy-image domain to the clean-image domain with the reverse rain-synthesis branch used only for bidirectional learning. Both generators and discriminators were optimized using Adam with a batch size of 4. The complete training process required approximately 24 hours. Unless otherwise stated, all experiments used the same training configuration.

In terms of dataset, we evaluate DRC-Derain on the RealRain1K-L dataset [46], which provides real rainy im- ages together with their corresponding clean references. To preserve the fully unpaired training setting, the rainy and clean subsets are treated as two independent domains, and [URL 🔗](#page-0)

Authors :

Preprint submitted to Elsevier

the rainy-clean correspondences are never used for optimiza- tion. The paired clean references are accessed only at test time for quantitative evaluation.

Following common practice in image restoration [41? ], we report Peak Signal-to-Noise Ratio (PSNR) [47] and Structural Similarity Index Measure (SSIM) [48]. PSNR evaluates pixel-level reconstruction fidelity, whereas SSIM measures structural consistency between the restored output and its clean reference. Higher values of both metrics indi- cate better restoration quality. [URL 🔗](#page-0)

## 4.2. Comparisons and Evaluations

## 4.2.1. Qualitative Comparison

We conduct visual comparisons under two complemen- tary settings: in-distribution evaluation on RealRain1K- L [46] and out-of-distribution evaluation on real rainy images without ground-truth references. [URL 🔗](#page-0)

Figure 3 presents qualitative comparisons onRealRain1K- L across different rain densities, textures, and scene struc- tures. The results reveal distinct failure modes among the competing methods. NLAQNet and Derain-CycleGAN re- move part of the visible rain but often retain residual streaks, especially in heavily degraded regions such as (a), (c), (f), and (i). Their outputs also exhibit local blurring in fine textures, for example around the roof pattern in (b) and building structures in (g)-(h). NLCL produces aggressive rain suppression, but several examples show noticeable brightness and color shifts, particularly in (a), (d), (e), and (j), indicating that the restoration may alter the global scene appearance together with the degradation. DCD-GAN, DRFormer, and CSUD generally preserve the overall scene more faithfully. However, their limitations become appar- ent in the enlarged regions. DCD-GAN occasionally over- smooths local textures or removes low-contrast structures together with rain, as visible in (b), (c), and (f). DRFormer preserves edges better, but residual streaks remain in some dense-rain cases, particularly (a), (i), and (j). CSUD achieves a good balance in many examples, yet faint rain residues or slight texture softening can still be observed in repetitive and low-contrast regions, such as (b), (f), and (g). [URL 🔗](#page-0)

These observations highlight the main advantage of the proposed detect-restore-compose formulation. Methods based on full-image translation must simultaneously remove degradation and reconstruct already reliable content, which can lead to residual rain, over-smoothing, or appearance drift. DRC-Derain instead restricts restoration to the pre- dicted rain support and preserves the remaining content directly from the input, leading to a more stable trade-off between rain suppression and content preservation.

Figure 4 evaluates out-of-distribution generalization on real rainy images collected from the Internet, where no clean ground truth is available. The comparison reveals that several methods degrade noticeably when the rain appear- ance differs from the training distribution NLAQNet and Derain-CycleGAN often leave residual streaks in dense or spatially irregular rain regions, as observed in (a), (c), (e), [URL 🔗](#page-0)


*Figure 3: Qualitative deraining results on the RealRain1K-L dataset.*

and (f), while NLCL tends to introduce substantial bright- ness and contrast shifts across multiple scenes. DCD-GAN, DRFormer, and CSUD preserve the global appearance more reliably, but faint residual rain or local over-smoothing re- mains visible in textured vegetation, road surfaces, and night scenes, particularly in (c), (d), (g), and (j).

In comparison, DRC-Derain shows more stable behavior across these unseen conditions. It suppresses prominent rain while preserving local texture, contrast, and scene structure,

Authors :

Preprint submitted to Elsevier

including vegetation in (c)-(d), architectural details in (f), low-light road regions in (g), and smooth surfaces in (h)-(j). The results suggest that explicitly localizing the rain support before restoration improves robustness to out-of-distribution rain patterns, since the model avoids unnecessary modifica- tion of unaffected regions and limits reconstruction to the detected degradation.


*Figure 4: Visual comparisons of deraining results on out-of-distribution samples*

## 4.2.2. Quantitative Comparisons

Table 1 compares DRC-Derain with both supervised and unsupervised deraining methods on RealRain1K-L, RealRain1K-H, SPA, and Night-Rain. Among the unsu- pervised approaches, DRC-Derain consistently achieves the best results across all four benchmarks in terms of both PSNR and SSIM. The advantage is particularly clear over earlier unpaired methods such as DerainCycleGAN, NLCL, and DCD-GAN, while DRC-Derain also consistently surpasses CSUD, the strongest unsupervised baseline in the comparison. The improvement remains stable across [URL 🔗](#page-0)

datasets with different rain densities and imaging conditions, suggesting that the gain is not tied to a specific benchmark. Although supervised methods still benefit from paired rainy- clean training data and obtain higher scores in several cases, DRC-Derain substantially narrows the performance gap without using paired correspondences during optimization. These results support the effectiveness of localized detect- restore-compose processing together with mask-guided bidi- rectional learning for unpaired deraining.


*Table 1 Quantitative comparisons of different deraining methods on the RealRain1K-L [46], RealRain1K-H [46], SPA [20] , and Night-Rain [49] datasets. The best and second-best results among the unsupervised methods are highlighted in red and blue, respectively. S and U denote supervised and unsupervised methods, respectively. [URL 🔗](#page-0)*

| Methods | RealRain1K-L RealRain1K-H | SPA | Night-Rain |
| --- | --- | --- | --- |
|   | PSNR↑ SSIM↑ PSNR↑ SSIM↑ PSNR↑ SSIM↑ PSNR↑ SSIM↑ |   |   |
| NLAQNet (S) | 34.16 0.963 32.49 0.958 40.50 0.984 31.46 0.925 |   |   |
| Restormer (S) | 40.90 0.985 39.57 0.981 47.98 0.992 36.92 0.969 |   |   |
| DRSformer (S) | 41.52 0.982 48.53 0.992 48.53 0.992 37.86 0.971 |   |   |
| NeRD-Rain-S (S) | 38.64 0.979 36.69 0.970 48.90 0.9936 38.42 0.973 |   |   |
| DerainCycleGAN (U) 28.16 0.901 24.78 0.844 34.12 0.950 27.84 0.851 |   |   |   |
| NLCL (U) | 23.06 0.832 20.64 0.719 33.82 0.9468 25.58 0.821 |   |   |
| DCD-GAN (U) | 30.49 0.939 27.82 0.895 34.16 0.943 28.68 0.867 |   |   |
| CSUD (U) | 32.71 0.959 27.82 0.895 34.78 0.949 29.90 0.879 |   |   |
| Ours (U) | 34.95 0.964 30.01 0.913 35.65 0.957 30.56 0.898 |   |   |

*Table 2 Comparisons of model and time complexity against state-of- the-art methods. The best and second best results are marked in red and blue, respectively.*

| Method |   | FLOPs (G) Params (M) Time (ms) |   |
| --- | --- | --- | --- |
| NLAQNet | 498.77 | 14.52 | 370.89 |
| Derain-CycleGAN | 99.062 | 6.244 | 68.80 |
| NLCL | 20.863 | 0.316 | 22.30 |
| DCD-GAN | 64.196 | 11.378 | 29.77 |
| DRSformer | 220.378 | 33.627 | 416.30 |
| CSUD | 16.249 | 29.160 | 37.41 |
| DRC-Derain (Ours) | 12.529 | 2.213 | 15.20 |

Model Efficiency. Table 2 compares the computational ef- ficiency ofDRC-Derain with representative deraining meth- ods in terms of FLOPs, parameter count, and runtime. DRC- Derain requires the lowest number of FLOPs among the compared models while maintaining the second-smallest pa- rameter count, indicating that the proposed localized restora- tion strategy does not introduce excessive computational overhead. For a fair runtime comparison, all methods are evaluated on a single NVIDIATesla T4GPU using 256×256 inputs, batch size 1, and FP32 precision, with data loading excluded. Under this setting, DRC-Derain is also the fastest method, running approximately 1.5× faster than NLCL [39], the second-fastest baseline, and about 27× faster than DRS- former [50]. Although NLCL uses fewer parameters, its full- resolution processing incurs substantially higher FLOPs, which translates into a longer inference time. These results show that DRC-Derain achieves a favorable balance between restoration quality and computational efficiency. [URL 🔗](#page-0)

## 4.3. Ablation study

Semantic Contrastive Loss. We introduce the semantic

contrastive loss to encourage the model to remove rain streaks while preserving image details. To demonstrate its effectiveness, we remove this loss to obtain config. B. As shown in Table 3, removing the semantic contrastive loss degrades both PSNR and SSIM. We further provide visual results in Fig. 5, where the full model removes more rain arti- facts and better preserves details that are close to the content [URL 🔗](#page-0)

*Figure 5: Ablation study on Semantic contrastive loss. Please zoom in for best view*

image. This is because the semantic contrastive loss imposes two complementary forces on the network in the embedding space. The pulling force acts between the input image 𝑥 and its cycle reconstruction 𝐹(𝐺(𝑥)), driving the reconstruction back toward the input and thereby encouraging the network to preserve image details. The pushing force acts between the input image 𝑥 and the translated image 𝐺(𝑥), separating them in the embedding space and thereby encouraging the network to remove rain artifacts.

Why the pulling force preserves details. The cycle 𝑥 → 𝐺(𝑥) → 𝐹(𝐺(𝑥)) acts as an information bottleneck: any image detail that 𝐺 removes together with the rain cannot be recovered by 𝐹, since 𝐹 only sees 𝐺(𝑥). A detail lost in 𝐺(𝑥) therefore also disappears from 𝐹(𝐺(𝑥)), making the reconstruction deviate from 𝑥. The pixel-wise cycle- consistency loss penalizes this deviation only weakly, be- cause thin structures such as edges, text and fine textures occupy few pixels and contribute little to an averaged 𝓁1 error. In contrast, the pulling force measures the deviation in a semantic embedding space, where such structures shape the scene representation regardless of how many pixels they cover. Minimizing 𝑑(𝑥, 𝐹(𝐺(𝑥))) thus forces 𝐹(𝐺(𝑥)) to keep the semantics of 𝑥, which is only possible if 𝐺(𝑥) itself retains the scene details. In other words, the pulling force regularizes the forward mapping 𝐺 through the cycle, so that 𝐺 learns to remove rain rather than everything that looks like high-frequency content.

Evidence in the embedding space. We encode 𝑥, 𝐺(𝑥) and 𝐹(𝐺(𝑥)) of all test set of RealRain1K-L with the DA-CLIP image encoder and measure the cosine distance 𝑑(⋅, ⋅) = 1−cos(⋅, ⋅) (Fig. 6(a)).Without the semantic contrastive loss, the pull distance more than doubles (0.073 vs. 0.034) and increases for 92% of the images (Wilcoxon signed-rank test, 𝑝 < 10−30). The variation also becomes much larger (std 0.046 vs. 0.020): while the full model reconstructs every image within a narrow band, config. B exhibits a long tail of images whose reconstructions drift far from the input, corresponding to scenes where substantial content is lost. [URL 🔗](#page-0)

Evidence in the image space. The residual |𝑥 − 𝐺(𝑥)| reveals what each model removes from the input. Fig. 6(b) shows a zoomed region of the detail example in the second row of Fig. 5. The residual of the full model consists mainly of thin rain streaks, whereas that of config. B clearly contains [URL 🔗](#page-0)


*Table 3 Ablation study on the RealRain1K-L [46] dataset. Config. A is our full model. [URL 🔗](#page-0)*

| Config. Semantic VLM Mask Frequency PSNR SSIM |   |   |   |
| --- | --- | --- | --- |
| A (Ours) |   | ✓ ✓ ✓ ✓ | 34.95 0.96 |
| B | × | ✓ ✓ ✓ | 30.97 0.89 |
| C |   | × ✓ ✓ | 33.25 0.93 |
| D | × × | ✓ ✓ | 31.15 0.89 |
| E | ✓ ✓ | × | 33.16 0.92 |
| F | ✓ ✓ ✓ |   | × 32.61 0.91 |

the characters on the shop sign and the edge of the pillar, and its mean value in this region is 73% higher. The difference map confirms that these structures are removed only by con- fig. B. Text and object boundaries are image content rather than rain; their presence in the residual means that config. B erases them from the derained output, which matches the blurred sign in Fig. 5 and is consistent with its lower SSIM in Table 3, as SSIM is particularly sensitive to structural information. [URL 🔗](#page-0)

Interaction with the pushing force. Interestingly, the push distance 𝑑(𝑥, 𝐺(𝑥)) of config. B is slightly larger (0.249 vs. 0.221). Since the DA-CLIP image embedding reflects both the rain and the scene content, a larger push distance does not necessarily indicate stronger rain removal. The residual analysis above shows that config. Bmoves 𝐺(𝑥) further from 𝑥 partly by removing scene content, which also changes the embedding. The two forces are therefore complementary: the pushing force moves 𝐺(𝑥) away from the rainy input, while the pulling force constrains this movement to the rain component, so that the translation removes rain streaks without sacrificing image details.

Vision-Language Model-Based Loss To further sup-

press rain streaks in the output image, we introduce a vision-language model-based loss. Specifically, we employ Degradation-Aware CLIP (DA-CLIP) [51] to score how effectively rain has been removed from the generated image. To demonstrate the effectiveness of this loss, we remove it to obtain config. C. As shown in Fig. 7, config. C leaves visible rain streaks in its outputs, whereas the full model removes them more thoroughly and produces results closer to the ground truth. [URL 🔗](#page-0)

To understand why the loss improves rain removal, we visualize the rain masks predicted by the generator in Fig. 8. The mask of the full model is concentrated on the rain in the input and leaves the pillars and window frames unmarked. In contrast, the mask of config. C also covers the pillar edges and window frames, which contain no rain, and spreads weak activations over the whole image. This behavior is consistent over the test set: the mask of config. C is larger than that of the full model for every image, yet config. C removes less rain, with a lower residual |𝑥 − 𝐺(𝑥)| in 64% of the images. Hence, without the vision-language model- based loss, the network fails to separate rain from high- frequency scene structures; it spreads its mask over both but [URL 🔗](#page-0)

removes the rain less effectively. By providing rain-aware degradation semantics, DA-CLIP guides the mask toward the actual rain regions, which allows the network to remove rain streaks more thoroughly.

To further demonstrate the effectiveness of each loss and of their combination, we remove both the semantic contrastive loss and the vision-language model-based loss to obtain config. D. As shown in Fig. 9, config. D suffers from residual rain streaks, colour shifts, and blurred edge details, most visibly in the 2nd scene. Adding either loss alone substantially reduces the rain artifacts, though a small amount of streaking remains, while combining the two re- moves rain streaks most effectively. Notably, without the semantic contrastive loss (config. C), the output exhibits unnatural noise artifacts that break the smoothness of the image content, confirming the role of this loss in preserving fine details and color fidelity. [URL 🔗](#page-0)

Mask-Guided Module We introduce a mask-guided mod- ule to further guide the rain mask generation of the network. To demonstrate its effectiveness, we remove the mask guided module to obtain config. E. As shown in Fig. 10, config. E suffers from under-deraining, leaving residual rain streaks in the output image. The quantitative results in Table 3 further demonstrate the effectiveness of the mask-guided module. [URL 🔗](#page-0)

To understand how the mask-guided mechanism affects rain removal, we visualize Grad-CAM with respect to the removed content, i.e., the regions that drive the network to modify the input, together with the error maps |𝐺(𝑥) − GT| in Fig. 11. For the full model, the Grad-CAM forms continuous bands that follow the rain streaks, indicating that its restoration is concentrated on the rainy regions. Without mask guidance (config. E), the Grad-CAM is weaker and fragmented into isolated spots, part of which fall on the rain- free background; the network thus spreads its restoration over the image instead of focusing on the rain. The error maps reveal the consequence of this behavior: config. E leaves bright streak-shaped residues in the lower part of the image, where the rain is densest, whereas the error map of the full model is largely free of such residues. The isolated bright spots that appear in both error maps are not caused by rain but by content that differs between the input and the ground truth. This observation is consistent with the quantitative results: the full model removes a larger share of the rain layer and achieves a higher PSNR than config. E (Table 3). [URL 🔗](#page-0)

Frequency-Aware Block We design a frequency-aware block to better shape the rain mask, and we demonstrate its effectiveness through an ablation study. Replacing the frequency-aware block with a standard ResNet-based block yields config. F. Our frequency-aware block achieves signif- icantly higher scores than config. F. As shown in Fig. 12, config. A produces a more accurate rain mask, which allows the network to remove more rain streaks than config. F. Moreover, because the mask does not falsely activate on [URL 🔗](#page-0)


rain-free regions, those regions are left unchanged, result- ing in better structure preservation (e.g., the 2nd scene in Fig. 12). To further analyze this effect, Fig. 13 visualizes the predicted rain masks together with the residuals |𝑥 − 𝐺(𝑥)|, i.e., what each model removes from the input. Without the frequency-aware block, the mask of config. F barely re- sponds to the rain streaks, and its residual is correspondingly almost empty in the two scenes. In contrast, the mask of the full model captures the rain streaks, and its residual contains the corresponding streaks. This confirms that the frequency- aware block enables the network to detect rain streaks, which in turn guides their removal. [URL 🔗](#page-0)

## 4.4. Limitation

Performance on Challenging Conditions. Unsuper- vised deraining becomes considerably more difficult when rain falls at oblique angles rather than in the vertical or near- vertical direction. Fig. 14 presents the deraining results of DRC-Derain on such images. While most streaks are cor- rectly detected and removed, those oriented close to the hori- zontal remain largely untouched.We attribute this behaviour to the directional bias of the training distribution: nearly horizontal streaks are rare and act as outliers in datasets dominated by vertical and near-vertical rain patterns, so the learned rain prior does not cover them well. Augmenting the training data with a wider range of streak orientations, or introducing an explicit orientation-invariant constraint, is a promising direction to address this limitation. [URL 🔗](#page-0)

## 5. Conclusion

*Figure 6: Analysis of the semantic contrastive loss. (a) Cosine distances in the DA-CLIP embedding space over test set of RealRain1K-L: push 𝑑(𝑥, 𝐺(𝑥)) and pull 𝑑(𝑥, 𝐹(𝐺(𝑥))); bars show mean ± std, dots show individual images. (b) Residual maps of the bottom-left region of image shown in second row of Fig. 5, sharing one colour scale. In the difference map, red marks content removed only by config. B: the characters on the shop sign and the pillar edge, which the full model preserves. [URL 🔗](#page-0)*

*Figure 7: Ablation study on the vision-language model-based loss. Without this loss (config. C), rain streaks remain in the output. Please zoom in for the best view.*

*Figure 8: Predicted rain masks overlaid on the rainy input. The mask of the full model covers the rain in the input, whereas that of config. C also covers the pillar edges and window frames, which contain no rain.*

*Figure 9: Ablation study on both losses. Please zoom in for best view.*


*Figure 10: Ablation study on mask guided. Please zoom in for best view*

*Figure 11: Grad-CAM with respect to the removed content and error maps |𝐺(𝑥) −GT|. The Grad-CAM of the full model forms continuous bands aligned with the rain streaks, whereas that of config. E is fragmented into isolated spots and partly falls on the rain-free background; accordingly, config. E leaves more rain in its output. The two error maps share one colour scale.*

*Figure 14: Example results of DRC-Derain under oblique rainfall conditions.*

*Figure 12: Ablation study on frequency aware block. Please zoom in for best view*

*Figure 13: Rain masks and residuals |𝑥−𝐺(𝑥)| of config. F and the full model (config. A); the two residuals in each row share one colour scale.*

Authors :

Preprint submitted to Elsevier


## CRediT authorship contribution statement

: .

## References

- [1] X. Liu, X. Liao, X. Shi, L. Qing, and C. Ren, “Efficient information modulation network for image super-resolution,” in 26th European Conference on Artificial Intelligence (ECAI), 2023, pp. 1544–1551.

- [2] C. Ren, Y. Pan, and J. Huang, “Enhanced latent space blind model for real image denoising via alternative optimization,” in Advances in Neural Information Processing Systems, S. Koyejo, S. Mohamed, A. Agarwal, D. Belgrave, K. Cho, and A. Oh, Eds., vol. 35, 2022, pp. 38 386–38 399.

- [3] X. Fu, J. Huang, Y. Liao, and J. Paisley, “Clearing the skies: A deep network architecture for single-image rain removal,” IEEE Transac- tions on Image Processing, vol. 26, pp. 2944–2956, 09 2016.

- [4] K. He, J. Sun, and X. Tang, “Single image haze removal using dark channel prior,” IEEE Transactions on Pattern Analysis and Machine Intelligence, vol. 33, no. 12, pp. 2341–2353, 2011.

- [5] S. W. Zamir, A. Arora, S. Khan, M. Hayat, F. S. Khan, and M.-H. Yang, “Restormer: Efficient transformer for high-resolution image restoration,” in CVPR, 2022.

- [6] V. Potlapalli, S. W. Zamir, S. Khan, and F. Khan, “PromptIR: Prompting for all-in-one image restoration,” in Thirty-seventh Conference on Neural Information Processing Systems, 2023. [Online]. Available: https://openreview.net/forum?id=KAlSIL4tXU [URL 🔗](https://openreview.net/forum?id=KAlSIL4tXU)

- [7] L. Liu, W. Ouyang, X. Wang, P. Fieguth, J. Chen, X. Liu, and M. Pietikäinen, “Deep learning for generic object detection: A sur- vey,” International Journal ofComputer Vision, vol. 128, no. 2, pp. 261–318, 2020.

- [8] X. Liu, X. Shi, L. Chen, L. Qing, and C. Ren, “Efficient parallel multi- scale detail and semantic encoding network for lightweight semantic segmentation,” in Proceedings of the 31st ACM International Con- ference on Multimedia, ser. MM ’23, New York, NY, USA, 2023, p. 2544–2552.

- [9] X. Fu, J. Huang, D. Zeng, Y. Huang, X. Ding, and J. Paisley, “Remov- ing rain from single images via a deep detail network,” in Proceedings ofthe IEEE Conference on Computer Vision and Pattern Recognition (CVPR), July 2017.

- [10] H. Zhang and V. M. Patel, “ Density-Aware Single Image De-raining Using a Multi-stream Dense Network ,” in 2018 IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR), Los Alamitos, CA, USA, Jun. 2018, pp. 695–704. [Online]. Available: https://doi.ieeecomputersociety.org/10.1109/CVPR.2018.00079

- [11] X. Hu, C.-W. Fu, L. Zhu, and P.-A. Heng, “Depth-attentional features for single-image rain removal,” in The IEEE Conference on Computer Vision and Pattern Recognition (CVPR), 2019, pp. 8022–8031.

- [12] X. Li, J. Wu, Z. Lin, H. Liu, and H. Zha, “Recurrent squeeze-and- excitation context aggregation net for single image deraining,” in European Conference on Computer Vision. Springer, 2018, pp. 262– 277.

- [13] D. Ren, W. Zuo, Q. Hu, P. Zhu, and D. Meng, “Progressive image de- raining networks: A better and simpler baseline,” in IEEE Conference on Computer Vision and Pattern Recognition, 2019.

- [14] K. Jiang, Z. Wang, P. Yi, C. Chen, B. Huang, Y. Luo, J. Ma, and J. Jiang, “Multi-scale progressive fusion network for single image deraining,” in IEEE/CVFConference on ComputerVision andPattern Recognition (CVPR), June 2020.

- [15] D. Lin, X.Wang, J. Shen, R. Zhang, R. Liu, M.Wang,W. Xie, Q. Guo, and P. Li, “Generative status estimation and information decoupling for image rain removal,” in Advances in Neural Information Pro- cessing Systems, S. Koyejo, S. Mohamed, A. Agarwal, D. Belgrave, K. Cho, and A. Oh, Eds., vol. 35, 2022, pp. 4612–4625.

- [16] J. Gu, X. Ma, X. Kong, Y. Qiao, and C. Dong, “Networks are slacking off: Understanding generalization problem in image deraining,” in Advances in Neural Information Processing Systems, vol. 36, 2023, pp. 28 565–28 584.

- [17] W. Yang, R. T. Tan, S. Wang, Y. Fang, and J. Liu, “ Single Image Deraining: From Model-Based to Data-Driven and Beyond ,” IEEE Transactions on Pattern Analysis & Machine Intelligence, vol. 43, no. 11, pp. 4059–4077, Nov. 2021. [Online]. Available: https://doi.ieeecomputersociety.org/10.1109/TPAMI.2020.2995190

- [18] C. Chen and H. Li, “Robust Representation Learning with Feedback for Single Image Deraining,” arXiv e-prints, p. arXiv:2101.12463, Jan. 2021.

- [19] X. Chen, J. Pan, and J. Dong, “Bidirectional multi-scale implicit neural representations for image deraining,” 06 2024, pp. 25 627– 25 636.

- [20] T. Wang, X. Yang, K. Xu, S. Chen, Q. Zhang, and R. Lau, “Spatial attentive single-image deraining with a high quality real rain dataset,” in on Computer Vision and Pattern Recognition, CVPR 2019, ser. Proceedings of the IEEE Computer Society Conference on Computer Vision and Pattern Recognition, United States, Jun. 2019, pp. 12 262–12 271, research Unit(s) information for this publication is provided by the author(s) concerned.; 32nd IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR 2019) ; Conference date: 16-06-2019 Through 20-06-2019. [Online]. Available: http://cvpr2019.thecvf.com/ Proceedings - 2019 IEEE/CVF Conference

- [21] Q. Yi, J. Li, Q. Dai, F. Fang, G. Zhang, and T. Zeng, “Structure-preserving deraining with residue channel prior guidance,” 2021 IEEE/CVF International Conference on Computer Vision (ICCV), pp. 4218–4227, 2021. [Online]. Available: https://api.semanticscholar.org/CorpusID:237260106

- [22] J. Jiang, Y. Luo, G. Liang, L. Lin, Z. Lin, and Y. Sun, “Derainmpe: A progressive recurrent image deraining model with mixture of prior experts,” Journal of Visual Communication and Image Representation, vol. 117, p. 104750, 2026. [Online]. Available: https: //www.sciencedirect.com/science/article/pii/S1047320326000453

- [23] Z. Ding, Y. Zhu, S. Niu, J. Wang, and Y. Su, “Ddr: A network of image deraining systems for dark environments,” Journal of Visual Communication and Image Representation, vol. 103, p. 104244, 2024. [Online]. Available: https://www.sciencedirect.com/science/ article/pii/S1047320324002001

- [24] Q. Tang, J. Yang, H. Liu, Z. Guo, andW. Jia, “Single image deraining using context aggregation recurrent network,” Journal of Visual Communication and Image Representation, vol. 75, p. 103039, 2021. [Online]. Available: https://www.sciencedirect.com/science/article/ pii/S1047320321000146

- [25] N. Jiang, W. Chen, L. Lin, and T. Zhao, “Single image rain removal via multi-module deep grid network,” Computer Vision and Image Understanding, vol. 202, p. 103106, 2021. [Online]. Available: https: //www.sciencedirect.com/science/article/pii/S1077314220301302

- [26] X. Lin, J. Yue, C. Ren, C.-L. Guo, and C. Li, “Unlocking low- light-rainy image restoration by pairwise degradation feature vector guidance,” 05 2023.

- [27] N. Gao, X. Jiang, X. Zhang, and Y. Deng, “Efficient frequency- domain image deraining with contrastive regularization,” in Computer Vision – ECCV 2024: 18th European Conference, Milan, Italy, September 29–October 4, 2024, Proceedings, Part XLI, Berlin, Heidelberg, 2024, p. 240–257. [Online]. Available: https://doi.org/10.1007/978-3-031-72940-9_14

- [28] Y. Liu, Y. Tian, Y. Zhao, H. Yu, L. Xie, Y. Wang, Q. Ye, J. Jiao, and Y. Liu, “Vmamba: visual state space model,” in Proceedings of the 38th International Conference on Neural Information Processing Systems, ser. NIPS ’24, Red Hook, NY, USA, 2024. [URL 🔗](https://doi.org/10.1007/978-3-031-72940-9_14)

- [29] Z. Zou, H. Yu, J. Huang, and F. Zhao, “Freqmamba: Viewing mamba from a frequency perspective for image deraining,” 10 2024, pp. 1905–1914.

- [30] H. Huang, A. Yu, and R. He, “Memory oriented transfer learning for semi-supervised image deraining,” in Computer Vision and Pattern Recognition, 2021, pp. 7732–7741. IEEE/CVF Conference on

- [31] W. Wei, D. Meng, Q. Zhao, Z. Xu, and Y. Wu, “Semi-supervised transfer learning for image rain removal,” in The IEEE Conference on Computer Vision and Pattern Recognition, 2019.


- [32] Y. Wei, Z. Zhang, Y. Wang, M. Xu, Y. Yang, S. Yan, and M. Wang, “Deraincyclegan: Rain attentive cyclegan for single image deraining and rainmaking,” IEEE Transactions on Image Processing, vol. 30, pp. 4788–4801, 2021.

- [49] F. Zhang, S. You, Y. Li, and Y. Fu, “Learning rain location prior for nighttime deraining,” in Proceedings of the IEEE/CVF International Conference on Computer Vision (ICCV), October 2023, pp. 13 148– 13 157.

- [50] X. Chen, H. Li, M. Li, and J. Pan, “Learning a sparse transformer net- work for effective image deraining,” in Proceedings ofthe IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR), June 2023, pp. 5896–5905.

- [33] R. Yasarla, V. A. Sindagi, and V. M. Patel, “Syn2real transfer learning for image deraining using gaussian processes,” in The IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR), June 2020.

- [51] Z. Luo, F. K. Gustafsson, Z. Zhao, J. Sjölund, and T. B. Schön, “Controlling vision-language models for universal image restoration,” in International Conference on Learning Representations (ICLR), 2024.

- [34] Y. Ye, Y. Chang, H. Zhou, and L. Yan, “Closing the loop: Joint rain generation and removal via disentangled image translation,” 2021 IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR), pp. 2053–2062, 2021. [Online]. Available: https://api.semanticscholar.org/CorpusID:232352745

- [35] Y. Liu, Z. Yue, J. Pan, and Z. Su, “Unpaired learning for deep image deraining with rain direction regularizer,” in Proceedings of the IEEE/CVF International Conference on Computer Vision, 2021, pp. 4753–4761.

- [36] X. Chen, J. Pan, K. Jiang, Y. Li, Y. Huang, C. Kong, L. Dai, and Z. Fan, “ Unpaired Deep Image Deraining Using Dual Contrastive Learning ,” in 2022 IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR), Los Alamitos, CA, USA, Jun. 2022, pp. 2007–2016. [Online]. Available: https: //doi.ieeecomputersociety.org/10.1109/CVPR52688.2022.00206

- [37] X. Jin, Z. Chen, J. Lin, Z. Chen, and W. Zhou, “Unsupervised single image deraining with self-supervised constraints,” 2019 IEEE International Conference on Image Processing (ICIP), pp. 2761–2765, 2018. [Online]. Available: https://api.semanticscholar. org/CorpusID:53788340

- [38] W. Xu, X. Chen, H. Guo, X. Huang, andW. Liu, “Unsupervised image restoration with quality-task-perception loss,” IEEE Transactions on Circuits and Systems for Video Technology, vol. 32, no. 9, pp. 5736– 5747, 2022.

- [39] Y. Ye, C. Xiao, Z. Wu, and Y. Tian, “Unsupervised deraining: Where contrastive learning meets self-similarity,” in Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR), 2022, pp. 5821–5830.

- [40] J.-Y. Zhu, T. Park, P. Isola, and A. A. Efros, “Unpaired image-to- image translation using cycle-consistent adversarial networks,” in Proceedings ofthe IEEE international conference on computer vision, 2017, pp. 2242–2251.

- [41] G. Dong, T. Zheng, Y. Cao, L. Qing, and C. Ren, “Channel consis- tency prior and self-reconstruction strategy based unsupervised image deraining,” in 2025 IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR), 2025, pp. 7469–7479.

- [42] H.-H. Liao et al., “Image deraining via self-supervised reinforcement learning,” 2024. [Online]. Available: 18270 https://arxiv.org/abs/2403.

- [43] Y. Chen, Y. Jin, X. Chen, Y. Wei, Z. Yan, and Y. Fu, “Unpaired image deraining using reward-guided self-reinforcement strategy,” in Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR), 2026.

- [44] Z. Yu, X. Chen, R. Li, Z. Geng, G. Sun, H. Li, and K. Jiang, “Derain- agent: A plug-and-play agent framework for rainy image restoration,” in arXiv preprint arXiv:2603.11866, 2026.

- [45] Q. Yang, Q. Guan, X. Chen, J. Jin, G. Jin, and J. Dong, “Unirain: Unified image deraining with rag-based dataset distillation and multi- objective reweighted optimization,” in Proceedings ofthe IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR), 2026.

- [46] W. Li, Q. Zhang, J. Zhang, Z. Huang, X. Tian, and D. Tao, “Toward real-world single image deraining: A new benchmark and beyond,” arXiv preprint arXiv:2206.05514, 2022.

- [47] R. C. Gonzalez and R. E.Woods, Digital Image Processing. Pearson, 2018.

- [48] Z. Wang, A. C. Bovik, H. R. Sheikh, and E. P. Simoncelli, “Image quality assessment: from error visibility to structural similarity,” IEEE Transactions on Image Processing, vol. 13, no. 4, pp. 600–612, 2004.
