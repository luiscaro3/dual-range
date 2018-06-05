/**
 * HTML Native dual range input
 * @author Luis Caro
 * @date 3/10/2018
 */

var Range = function (el) {
  var breakpointTemplate = function (left, point) {
    return (
      '<span class="range-breakpoint" style="left: ' + left + "%; transform: translateX(-" + left + '%)">' + point + "</span>"
    );
  };

  return RangeView = function (el) {

    this.$ = function (selector) {
      return $(el).find(selector);
    }

    this.$el = $(el);

    this.initialize = function (el) {

      // Main event to which the range responds to, it is not supported by IE so we make it a variable and we replace it with "change" for IE
      var slideEvent = "input";

      // If browser is Edge or IE11 run hack for z-index change
      var ua = window.navigator.userAgent;
      if (ua.indexOf("Trident/") != -1 || ua.indexOf("Edge/") != -1) {
        this.runIEHack();
      }

      // If it's IE11 also change event (IE doesnt support input event)
      if (ua.indexOf("Trident/") != -1) {
        slideEvent = "change";
      }

      this.data = this.$el.data();

      // Slider elements
      this.minSlider = this.$('[data-range-slider="min"]');
      this.maxSlider = this.$('[data-range-slider="max"]');

      // Min and max limits
      this.minLimit = parseInt(this.minSlider.attr("min"));
      this.maxLimit = parseInt(this.minSlider.attr("max"));

      // Label elements
      this.minOutput = this.$('[data-range-output="min"]');
      this.maxOutput = this.$('[data-range-output="max"]');

      // Set initial values on value attribute of output labels
      this.minOutput.val(this.minSlider.val());
      this.maxOutput.val(this.maxSlider.val());

      this.rangeBreakpoints = this.data.rangeBreakpoints;
      this.labelLimitValue = this.data.labelLimitValue;

      this.currentLocale = 'en-ES';

      // Set colors
      this.activeColor = this.$(".range-slider-container").css("background-color");
      this.inactiveColor = this.$(".range-slider-container").css("color");

      // Set initial values of component
      // If it's a single slider it has a single value, dual range sliders contain an object
      var initialValue = this.maxSlider.length
        ? {
          min: parseInt(this.minSlider.val()),
          max: parseInt(this.maxSlider.val())
        }
        : parseInt(this.minSlider.val());
      this.$el.val(initialValue);

      // Create breakpoint labels if breakpoints were passed
      if (this.rangeBreakpoints) {
        this.renderBreakpoints();
      }

      // Create custom event for compatibilities issues with IE
      this.$el.on(
        slideEvent,
        "input",
        function (event) {
          $(event.currentTarget).trigger("valueChange");
        }.bind(this)
      );

      // Prevent change event of slider to bubble and fire main component's change event
      this.$el.on("change", "input", function (event) {
        event.stopPropagation();
      });

      // Add is-active class to moving slider
      this.$el.on(
        "mousedown",
        '[type="range"]',
        function (el) {
          $(el.currentTarget).addClass("is-active");
        }.bind(this)
      );

      // Remove is-active class from all sliders in component
      this.$el.on(
        "mouseup",
        '[type="range"]',
        function (el) {
          this.$('[type="range"]').removeClass("is-active");
        }.bind(this)
      );

      // Make slider update its linked input or input update the slider
      this.$el.on(
        "valueChange",
        "[data-range-output], [data-range-slider]",
        this.updateLinkedInput.bind(this)
      );

      // These next two listeners are for when the selection has been done
      // Because of IE we need to split this into two listeners, otherwise we would just use change
      this.$el.on(
        "mouseup keyup",
        'input[type="range"]',
        function (event) {
          this.triggerChange(event);
        }.bind(this)
      );

      this.$el.on(
        "keyup blur",
        "[data-range-output]",
        function (event) {
          var pressedKey =
            typeof event.which == "number" ? event.which : event.keyCode;

          // Don't trigger unless is focus out or enter
          if (event.type == "keyup" && pressedKey != 13) {
            return false;
          }

          var value = event.currentTarget.innerHTML.replace(/\D/g, "");

          // If value is out of bounds cancel it and undo what the user typed
          if (value > this.maxLimit || value < this.minLimit) {
            event.currentTarget.innerHTML = event.currentTarget.value;
            return false;
          }

          // If values stayed the same don't update
          if (event.currentTarget.value == event.currentTarget.innerHTML) {
            return false;
          }

          // Clean content of input and change value
          event.currentTarget.value = value;
          event.currentTarget.innerHTML = value;

          // Trigger event for changing value (update handles position)
          $(event.currentTarget).trigger("valueChange");

          // Trigger change
          this.triggerChange(event);
        }.bind(this)
      );

      // Reflow labels
      this.$("input").trigger("valueChange");
    };

    this.renderBreakpoints = function () {
      var output = "";

      // If min limit wasn't included in the breakpoints add it
      if (this.rangeBreakpoints.indexOf(this.minLimit) == -1) {
        this.rangeBreakpoints.unshift(this.minLimit);
      }

      // If max limit wasn't included in the breakpoints add it
      if (this.rangeBreakpoints.indexOf(this.maxLimit) == -1) {
        this.rangeBreakpoints.push(this.maxLimit);
      }

      // Add passed breakpoints
      $.each(
        this.rangeBreakpoints,
        function (index, point) {
          var totalValues = this.maxLimit - this.minLimit,
            left = (point - this.minLimit) * 100 / totalValues;

          output += breakpointTemplate(left, this.formatValue(point));
        }.bind(this)
      );

      // render
      this.$("[data-range-breakpoints-container]").html(output);
    };

    /**
     * If range input changes update output box, if output box changes update range value
     */
    this.updateLinkedInput = function (event) {
      var data = $(event.currentTarget).data(),
        value = event.currentTarget.value,
        output = this.$('[data-range-output="' + data.rangeSlider + '"]'),
        slider = this.$('[data-range-slider="' + data.rangeOutput + '"]');

      if (data.rangeSlider) {
        // If it's a range slider update the output
        output.val(value);

        // If outputs can't be edited, allow formatting for the output label
        if (!this.minOutput.attr("contenteditable")) {
          value = this.formatValue(value);
        }

        output.html(value);
      } else {
        // If it's an output we're directly editing
        slider.val(value);
      }

      // Update background
      var minValue = this.minSlider.val() - this.minLimit;
      minValue = minValue ? minValue * 100 / (this.maxLimit - this.minLimit) : 0;

      if (this.maxSlider.length) {
        var maxValue = this.maxSlider.val() - this.minLimit;
        maxValue =
          maxValue || maxValue == 0
            ? maxValue * 100 / (this.maxLimit - this.minLimit)
            : 100;
        var background =
          "linear-gradient(to right, " +
          this.inactiveColor +
          " " +
          minValue +
          "%, " +
          this.activeColor +
          " " +
          minValue +
          "%, " +
          this.activeColor +
          " " +
          maxValue +
          "%, " +
          this.inactiveColor +
          " " +
          maxValue +
          "%)";
      } else {
        var background =
          "linear-gradient(to right, " +
          this.inactiveColor +
          " " +
          minValue +
          "%, " +
          this.activeColor +
          " " +
          minValue +
          "%)";
      }

      this.$(".range-slider-container").css("background", background);

      // If current slider is not a single slider (contains a min and max elements) push other slider when they overlap
      if (this.maxSlider.length) {
        this.pushSiblingHandle(event);
      }
    };

    this.formatValue = function (value) {
      // If labelLimitValue was defined and handle is on one of the limits, replace value with it
      if (
        this.labelLimitValue &&
        (value == this.minLimit || value == this.maxLimit)
      ) {
        return this.labelLimitValue;
      }

      if (this.data.rangeDuration) {
        var minTimestamp = moment()
          .startOf("day")
          .add(value, "minutes")
          .unix();
        return value == 0
          ? "0hr"
          : moment.unix(minTimestamp).format("H[hr] mm[min]");
      } else if (this.data.rangeTime) {
        return moment
          .unix(value)
          .tz(REVELEX.settings.currentTimeZone)
          .format('ddd h:mm[<span class="meridian">]a[</span>]');
      } else if (this.data.rangeCurrency) {
        var settings =
          typeof this.data.rangeCurrency == "string"
            ? {
              style: "currency",
              currency: this.data.rangeCurrency,
              minimumFractionDigits: 0
            }
            : {};
        return parseInt(value).toLocaleString(this.currentLocale, settings);
      }

      // If format wasn't defined return same value
      return value;
    };

    /**
     * If handles overlap, push the other one as you drag in that direction
     */
    this.pushSiblingHandle = function (event) {
      var minValue = parseInt(this.minSlider.val()),
        maxValue = parseInt(this.maxSlider.val());

      if (minValue > maxValue) {
        var sibling = $(event.currentTarget).siblings();

        if (this.rangeBreakpoints) {
          this.snapSibling = true;
        }

        // If we're editing an output label, update the html too
        if (event.currentTarget.dataset.rangeOutput) {
          sibling.html(event.currentTarget.value);
        }

        sibling.val(event.currentTarget.value).trigger("valueChange");
      }
    };

    /**
     * Snaps handle to breakpoints
     */
    this.snapHandle = function (el) {
      var target = el.currentTarget ? el.currentTarget : el,
        value = parseInt(target.value);

      $.each(
        this.rangeBreakpoints,
        function (index, point) {
          if (value <= point) {
            // Get middle point between points to determing where it's snapping to
            var previousPoint = this.rangeBreakpoints[index - 1] || this.minLimit,
              middle = (previousPoint + point) / 2;
            if (value > middle) {
              // If value is greater than middle point snap to next breakpoint (current one)
              var snappedValue = point;
            } else {
              // If not snap to current breakpoint (previous one)
              var snappedValue = this.rangeBreakpoints[index - 1];
            }

            // Run value change animation
            $({ value: value }).animate(
              { value: snappedValue },
              {
                step: function (a) {
                  target.value = a;
                },
                complete: function () {
                  // if it's a label update the html too
                  if (target.dataset.rangeOutput) {
                    target.innerHTML = snappedValue;
                  }

                  // Trigger change for it's output to change
                  $(target).trigger("valueChange");
                }.bind(this),
                duration: 20
              }
            );

            // Change sibling's value to make it snap
            if (this.snapSibling) {
              this.snapSibling = false;
              this.snapHandle($(target).siblings()[0]);
            }

            // Change components's value for change event (runs before the animation)
            var slider = target.dataset.rangeSlider
              ? target.dataset.rangeSlider
              : target.dataset.rangeOutput;
            this.setComponentValue(slider, snappedValue);
            return false;
          }
        }.bind(this)
      );
    };

    /**
     * Set values to the main component
     */
    this.setComponentValue = function (slider, value) {
      var sliderValue = this.$el.val();

      if (slider) {
        // If we are overriding values
        if (this.maxSlider.length) {
          sliderValue[slider] = value;
        } else {
          sliderValue = value;
        }
      } else {
        // Set active values
        sliderValue = this.maxSlider.length
          ? {
            min: parseInt(this.minSlider.val()),
            max: parseInt(this.maxSlider.val())
          }
          : parseInt(this.minSlider.val());
      }

      // Save values to component
      this.$el.val(sliderValue);
    };

    this.triggerChange = function (event) {
      if (this.rangeBreakpoints) {
        // Make handles snap to breakpoints
        this.snapHandle(event);
      } else {
        // Save value in component
        this.setComponentValue();
      }

      // Trigger component change event
      this.$el.trigger("change");
    };

    //Changing slider values manually
    this.val = function (param) {
      if (typeof param === "object") {
        this.minSlider.val(parseInt(param.min)).trigger("valueChange");
        this.maxSlider.val(parseInt(param.max)).trigger("valueChange");
      } else {
        this.minSlider.val(parseInt(param)).trigger("valueChange");
      }
    };

    //Reset range slider to initial values
    this.reset = function () {
      this.val({ min: this.minLimit, max: this.maxLimit });
    };

    // Hack for IE/Edge handles to move up z-index and make them accesible despite overlapping
    this.runIEHack = function () {
      this.$el.on(
        "mousemove",
        function (event) {
          var totalValues = this.maxLimit - this.minLimit,
            mouseOnValue = event.offsetX * totalValues / this.minSlider.width();
          mouseOnValue += this.minLimit;

          if (
            mouseOnValue - this.minSlider.val() >
            this.maxSlider.val() - mouseOnValue
          ) {
            // If we're closer to the max handle give it a higher z-index
            this.minSlider.css("z-index", 2);
            this.maxSlider.css("z-index", 3);
          } else {
            this.minSlider.css("z-index", 3);
            this.maxSlider.css("z-index", 2);
          }
        }.bind(this)
      );
    }

    this.initialize(el);
  }.bind($(el));
}

