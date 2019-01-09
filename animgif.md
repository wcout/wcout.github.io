# FLTK GIF Animation

[FLTK](http://www.fltk.org/) does not support loading/displaying animated GIF files
currently. There has been already some third party work on this subject here:

[KleineBre's FLTK stuff](https://ringbreak.dnd.utwente.nl/~mrjb/fltk/)

Unfortunately there are many animated GIF's that don't play well with this solution.
So I tried to fix the bugs, but after much disappointment decided to start from scratch. I found
[gif_load](https://github.com/hidefromkgb/gif_load), an easy to use header only GIF loader to reduce
the burden of decoding the GIF's to get more quickly (and safely) to the real work of designing
the interface to FLTK.

## Solution 1: External FLTK-Widget

My first solution was an external Widget `Fl_Anim_GIF`, derived from the basic FLTK widget `Fl_Box`.
This solution works well and can be found in the folder `extern`<del> 

But Kleine Bre's design approach to expand the `Fl_GIF_Image` class with animation capabilties
seems advantegeous. On the other hand I did not want to have `Fl_GIF_Image` load animated files
whithout being asked to. There was also a technical reason not to extend `Fl_GIF_Image`:
`Fl_GIF_Image` converts the images to `XPM` format and the transparent color is always put
at the first entry of the color table. This leads to problems when other frames of the GIF
have a different transparent color index.

## Solution 2: Replacement widget for current GIF class

So I came up with the idea to derive a class `Fl_Anim_GIF_Image` from `Fl_GIF_Image` that
stores its images directly in RGB-format without an intermittent `XPM`.

This solution can be found in the folder `intern`:

The files there can be copied directly into the FLTK source tree to replace the current GIF code.

`Fl_GIF_Image.cxx` is basically the original FLTK widget with some minor neccessary
changes (e.g. default constructor).

`Fl_Anim_GIF_Image.H`, `Fl_Anim_GIF_Image.cxx` is the implementation of the animated GIF
image class `Fl_Anim_GIF_Image`.

`gif_load.h` is the above mentioned GIF decoder, which is included from `Fl_Anim_GIF_Image.cxx`.

## Current status as of 2019/01/10

The implementation is complete and works well. It has been tested extensively with all kind
of GIF's - also with non-conforming and 'bad' ones.

**It has been compiled/tested currently on Linux only, but should work on Windows too.**

Some test programs are included in both solutions.

## Building

**[Note: instruction are for Linux]**

There are two simple scripts in the root directory `build-intern.sh` and `build-extern.sh`
that help to compile the test programs under Linux. Edit them to set your FLTK environment
before running.

(Don't use them unless you understand what you are doing...)

The external solution produces these files:

- `animgif`: The full test program
- `animgif-resize`: A program to show live resizing animated GIF's
- `animgif-simple`: The "hello world" version for animated GIF's

The internal solution produces these files:

- `animgifimage`: The full test program
- `animgifimage-resize`: A program to show live resizing animated GIF's
- `animgifimage-simple`: The "hello world" version for animated GIF's
- `animgifimage-play`: Demonstrates interacting with the class on single frame base

## Test

You can test the different solutions with the test programs in each folder.
For the `internal` approach you must have `FLTK` as source distribution to replace
the mentioned files. Both solutions offer roughly the same functionality.

`animgif`/`animgif-image`:

Put images into the `testsuite` folder and display all of them by starting
the test program with `-t`.

Or try the command line options for creating tiles, desaturate and color average.

Change the speed live using `+` and `-` keys.

Look at the minimal example programs to get a quick idea how to
use the class.

Test the resizing programs to get an impression about speed and memory consumption.

Have a look at the [API](https://wcout.github.io/animgif/html/class_fl___anim___g_i_f___image.html).
**[Note: This is currently not up to date, but sufficient to get a general impression]**

## Resume

I am not entirely convinced by the concept of the internal solution after all, but it is
not bad either. On the one hand is _cute_ to use it as a `Fl_Image`, on the other
hand exactly therefore it seems inappropriate to put more and more playing
functionality into it. The external solution so perhaps seems more advantegous after all..

Perhaps a generic `Fl_Animation` class (or whatever it may be called)
would make sense - and _one_ constructor for such a class could be an
`Fl_Animated_GIF_Image` (which would then not be needed to run the animation,
but only to supply the data). Or something like that.

[GitHub tarball download](https://github.com/wcout/fltk-gif-animation/archive/master.zip)

---
