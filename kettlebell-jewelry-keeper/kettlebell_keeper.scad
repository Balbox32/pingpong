// Kettlebell Jewelry Keeper - "M" edition
// A screw-top kettlebell keychain capsule to stash rings & earrings while you train.
//
// Parts (set PART on the command line or below):
//   "top"     - upper bell with handle, female thread, recessed M   (print in white / cream)
//   "cup"     - lower cup with flat base and male thread             (print in white / cream)
//   "inlay"   - the M letter that fills the recess on the top        (print in black)
//   "assembly"- coloured preview of everything closed
//   "exploded"- coloured preview, opened up
//
// Print orientation: as exported, no supports needed.
//   top  : seam face down on the bed, handle pointing up
//   cup  : flat base down on the bed

use <fonts/DMSerifDisplay-Regular.ttf>

PART = "assembly";

/* ---------- main dimensions (mm) ---------- */
R          = 22;     // outer radius of the bell
wall       = 2;      // minimum wall thickness
base_z     = -19;    // flat base (gives a ~22 mm standing foot)
seam_z     = -6;     // where the two halves meet

/* ---------- thread ---------- */
thread_h   = 6;      // engagement height (2 turns)
pitch      = 3;      // mm per turn
ecc        = 0.6;    // eccentricity of the twisted-circle thread (depth = 2*ecc)
r_male     = 17.2;   // male thread base radius
clearance  = 0.35;   // radial play; raise to 0.45 if your printer runs tight
bore_r     = 15;     // opening of the cup (30 mm - fits rings easily)

/* ---------- handle ---------- */
handle_r   = 14;     // radius of the arch centre line
handle_d   = 7;      // handle bar thickness
handle_cz  = 22;     // height of the arch centre
leg_bot_z  = 12;     // where the legs sink into the bell

/* ---------- lettering ---------- */
letter       = "M";
font         = "DM Serif Display";
letter_size  = 15;   // cap height-ish
letter_z     = 3.5;  // vertical centre of the letter on the bell
letter_depth = 1.0;  // inlay / engraving depth

/* ---------- decorative seam groove + grip flutes on the cup ---------- */
groove   = 0.7;
flutes   = 18;      // number of meridian grip grooves on the cup
flute_r  = 1.1;     // groove profile radius
flute_in = 0.55;    // how deep the grooves bite

$fn = 120;

seam_r = sqrt(R*R - seam_z*seam_z);

/* ================= helpers ================= */

module ball() { sphere(r = R, $fn = 160); }

// helical thread body: a circle offset from the axis, twisted as it rises
module thread_body(r, h, extra_top = 0) {
    turns_deg = -360 * (h + extra_top) / pitch;   // negative = right-hand thread
    translate([0, 0, seam_z])
        linear_extrude(height = h + extra_top, twist = turns_deg,
                       slices = ceil((h + extra_top) / pitch * 48), convexity = 4)
            translate([ecc, 0]) circle(r = r, $fn = 96);
}

// V groove that turns the split line into a design feature
module seam_groove() {
    rotate_extrude($fn = 160)
        polygon([[seam_r - groove, seam_z],
                 [seam_r + 1,      seam_z - groove - 1],
                 [seam_r + 1,      seam_z + groove + 1]]);
}

// meridian grooves that wrap the cup - a nicer look and real grip for twisting
module grip_flutes() {
    intersection() {
        for (i = [0 : flutes - 1])
            rotate([0, 0, i * 360 / flutes]) rotate([90, 0, 0])
                rotate_extrude($fn = 160)
                    translate([R + flute_r - flute_in, 0]) circle(r = flute_r, $fn = 24);
        translate([-50, -50, base_z + 1.5]) cube([100, 100, seam_z - base_z - 3]);
    }
}

module letter_prism() {
    translate([0, 0, letter_z])
        rotate([90, 0, 0])
            linear_extrude(height = R + 5)
                text(letter, size = letter_size, font = font,
                     halign = "center", valign = "center");
}

// the part of the letter that sits in the outer skin of the bell (front side)
module letter_skin() {
    intersection() {
        letter_prism();
        difference() {
            ball();
            sphere(r = R - letter_depth, $fn = 160);
        }
    }
}

module handle() {
    // arch
    translate([0, 0, handle_cz]) rotate([90, 0, 0])
        rotate_extrude(angle = 180, $fn = 96)
            translate([handle_r, 0]) circle(d = handle_d, $fn = 40);
    // legs, slightly flared where they meet the bell
    for (s = [-1, 1])
        translate([s * handle_r, 0, leg_bot_z])
            cylinder(h = handle_cz - leg_bot_z, d1 = handle_d + 1.6, d2 = handle_d, $fn = 40);
}

/* ================= top ================= */

// interior of the top: sphere-ish, but capped with a 45 degree cone
// so it prints without supports
module top_cavity() {
    r0 = r_male + ecc + clearance;
    pts = [ for (z = [0 : 0.5 : 20])
              let(rs = sqrt(max(0, (R - wall) * (R - wall) - z * z)),
                  rc = min(r0 + z, 19.5 - z))   // 45 deg out, then 45 deg back in
              [max(0, min(rs, rc)), z] ];
    rotate_extrude($fn = 120)
        polygon(concat([[0, -0.01]], pts, [[0, pts[len(pts) - 1][1]]]));
}

module top_part() {
    difference() {
        union() {
            intersection() {
                ball();
                translate([-50, -50, seam_z]) cube([100, 100, 100]);
            }
            handle();
        }
        // female thread (a little taller than the male so it seats on the shoulder)
        thread_body(r_male + clearance, thread_h, extra_top = 0.6);
        // entry chamfer
        translate([0, 0, seam_z - 0.01])
            cylinder(h = 0.8, r1 = r_male + ecc + clearance + 0.8, r2 = r_male + ecc + clearance, $fn = 120);
        translate([0, 0, seam_z + thread_h]) top_cavity();
        seam_groove();
        letter_skin();
    }
}

/* ================= cup ================= */

module cup_cavity() {
    floor_z = base_z + wall;
    // widest the cavity can get while keeping the wall >= wall
    pts = [ for (z = [floor_z : 0.25 : seam_z])
              let(rs = sqrt(max(0, (R - wall) * (R - wall) - z * z)),
                  rc = bore_r + (seam_z - z))      // 45 deg taper up to the bore
              [min(rs, rc), z] ];
    rotate_extrude($fn = 120)
        polygon(concat([[0, floor_z]], pts, [[bore_r, seam_z], [bore_r, 1], [0, 1]]));
}

module cup_part() {
    difference() {
        union() {
            intersection() {
                ball();
                translate([-50, -50, base_z]) cube([100, 100, seam_z - base_z]);
            }
            // male thread collar with a lead-in chamfer on top
            intersection() {
                thread_body(r_male, thread_h);
                translate([0, 0, seam_z])
                    cylinder(h = thread_h, r1 = r_male + ecc + 2 + thread_h - 0.8 , r2 = r_male + ecc - 0.8, $fn = 120);
            }
        }
        cup_cavity();
        seam_groove();
        grip_flutes();
    }
}

/* ================= output ================= */

white = [0.96, 0.94, 0.88];   // warm cream white
black = [0.08, 0.08, 0.08];

module assembly(open = 0) {
    color(white) translate([0, 0, open]) top_part();
    color(black) translate([0, 0, open]) letter_skin();
    color(white) cup_part();
}

// export orientations: every part sits on z = 0
if (PART == "top")      translate([0, 0, -seam_z]) top_part();
if (PART == "cup")      translate([0, 0, -base_z]) cup_part();
if (PART == "inlay")    translate([0, 0, -seam_z]) letter_skin();
if (PART == "assembly") assembly(0);
if (PART == "exploded") assembly(22);
