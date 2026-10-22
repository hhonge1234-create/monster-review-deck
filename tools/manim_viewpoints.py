"""manim scene for slide 10: one event, three viewpoints (컬러 라쇼몽).
Render: <manim-python> -m manim -qh --format mp4 -o viewpoints manim_viewpoints.py Viewpoints
"""
from manim import *

PAPER, INK, MUTED = "#F7F4EC", "#22301F", "#6B7464"
SKY, SUN, MOSS, RED = "#6F93B4", "#D9A33A", "#3F6B34", "#D63B2F"
FONT = "Apple SD Gothic Neo"
config.background_color = PAPER


def T(s, size=30, color=INK, weight=NORMAL):
    return Text(s, font=FONT, font_size=size, color=color, weight=weight)


class Viewpoints(Scene):
    def construct(self):
        head = T("같은 사건, 세 개의 시선", 34, INK, BOLD).to_edge(UP, buff=0.45)
        self.play(FadeIn(head, shift=DOWN * 0.2), run_time=0.6)

        event = Circle(radius=1.05, color=INK, stroke_width=4).set_fill(WHITE, 1).shift(RIGHT * 1.6 + UP * 0.25)
        elab = T("사건", 34, INK, BOLD).move_to(event)
        self.play(GrowFromCenter(event), FadeIn(elab), run_time=0.7)

        lenses = [("엄마 · 사오리", SKY, "선생님이 아이를 때렸다"),
                  ("담임 · 호리", SUN, "미나토가 요리를 괴롭힌다"),
                  ("아이들 · 미나토와 요리", MOSS, "둘은 서로를 지키고 있었다")]
        ys = [1.55, 0.25, -1.05]
        verdict = None
        history = VGroup()
        nodes = []
        for i, (who, col, says) in enumerate(lenses):
            dot = Dot(radius=0.2, color=col).move_to(LEFT * 5.2 + UP * ys[i])
            lab = T(who, 22, col, BOLD).next_to(dot, RIGHT, buff=0.22)
            node = VGroup(dot, lab)
            nodes.append(node)
            ray = Arrow(lab.get_right() + RIGHT * 0.1, event.get_left() + UP * (ys[i] - 0.25) * 0.35,
                        color=col, stroke_width=5, buff=0.15, max_tip_length_to_length_ratio=0.08)
            ray.set_z_index(-1)
            new_v = T(f"“{says}”", 30, col, BOLD).move_to(DOWN * 2.35 + RIGHT * 1.6)
            step = T(f"PART {i+1}", 18, MUTED).next_to(new_v, UP, buff=0.18)
            self.play(FadeIn(node, shift=RIGHT * 0.3), run_time=0.5)
            anims = [GrowArrow(ray), event.animate.set_stroke(col, 8), elab.animate.set_color(col)]
            if verdict is not None:
                old_v, old_step = verdict
                strike = Line(old_v.get_left(), old_v.get_right(), color=RED, stroke_width=5)
                self.play(Create(strike), run_time=0.45)
                small = VGroup(old_v, strike)
                self.play(FadeOut(old_step),
                          small.animate.scale(0.55).set_opacity(0.5).move_to(UP * (2.5 - 0.45 * len(history)) + RIGHT * 4.5),
                          run_time=0.6)
                history.add(small)
            self.play(*anims, run_time=0.8)
            self.play(FadeIn(step), Write(new_v), run_time=0.9)
            self.wait(1.0)
            self.play(FadeOut(ray), run_time=0.3)
            verdict = (new_v, step)

        # finale: all lenses at once, truth is plural
        rays = VGroup(*[Line(n[1].get_right() + RIGHT * 0.12, event.get_center(), color=n[0].get_color(), stroke_width=3, stroke_opacity=0.6) for n in nodes])
        rays.set_z_index(-1)
        tri = VGroup(*[Arc(radius=1.25, start_angle=a, angle=TAU / 3 - 0.12, color=c, stroke_width=10).move_arc_center_to(event.get_center())
                       for a, c in zip([PI / 2, PI / 2 + TAU / 3, PI / 2 + 2 * TAU / 3], [SKY, SUN, MOSS])])
        self.play(Create(rays), Create(tri), event.animate.set_stroke(INK, 4), elab.animate.set_color(INK), run_time=1.0)
        final = T("진실은 하나가 아니다", 40, RED, BOLD).move_to(DOWN * 2.35 + RIGHT * 1.6)
        self.play(FadeOut(verdict[0]), FadeOut(verdict[1]), run_time=0.4)
        self.play(Write(final), run_time=1.0)
        self.wait(2.2)
