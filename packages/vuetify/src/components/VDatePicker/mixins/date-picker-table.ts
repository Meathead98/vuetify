import '../VDatePickerTable.sass'

// Directives
import Touch, { TouchWrapper } from '../../../directives/touch'

// Mixins
import Colorable from '../../../mixins/colorable'
import Localable from '../../../mixins/localable'
import Themeable from '../../../mixins/themeable'

// Utils
import isDateAllowed, { AllowedDateFunction } from '../util/isDateAllowed'
import mixins from '../../../util/mixins'

// Types
import { VNodeChildren } from 'vue'
import { PropValidator } from 'vue/types/options'
import { DatePickerFormatter } from '../util/createNativeLocaleFormatter'
import { DateEvents, DateEventColors, DateEventColorValue } from '../VDatePicker'

export default mixins(
  Colorable,
  Localable,
  Themeable
/* @vue/component */
).extend({
  directives: { Touch },

  props: {
    allowedDates: Function as PropValidator<AllowedDateFunction | undefined>,
    currentDate: String,
    disabled: Boolean,
    dateFormat: Function as PropValidator<DatePickerFormatter>,
    events: {
      type: [Array, Function, Object],
      default: () => null
    } as any as PropValidator<DateEvents>,
    eventColor: {
      type: [Array, Function, Object, String],
      default: () => 'warning'
    } as any as PropValidator<DateEventColors>,
    min: String,
    max: String,
    readonly: Boolean,
    scrollable: Boolean,
    pickerDate: {
      type: String,
      required: true
    },
    value: [String, Array]
  },

  data: () => ({
    isReversing: false
  }),

  computed: {
    computedTransition (): string {
      return (this.isReversing === !this.$vuetify.rtl) ? 'tab-reverse-transition' : 'tab-transition'
    },
    displayedMonth (): number {
      return Number(this.pickerDate.split('-')[1])
    },
    displayedYear (): number {
      return Number(this.pickerDate.split('-')[0])
    }
  },

  watch: {
    pickerDate (newVal: string, oldVal: string) {
      this.isReversing = newVal < oldVal
    }
  },

  methods: {
    calculatePickerDate (delta: number): string {
      throw new Error('Not implemented')
    },
    genButtonClasses (isAllowed: boolean, isFloating: boolean, isSelected: boolean, isCurrent: boolean) {
      return {
        'v-size--default': !isFloating,
        'v-btn--active': isSelected,
        'v-btn--flat': !isAllowed || this.disabled,
        'v-btn--text': !isCurrent && !isSelected,
        'v-btn--rounded': isFloating,
        'v-btn--disabled': !isAllowed || this.disabled,
        'v-btn--outlined': isCurrent && !isSelected,
        ...this.themeClasses
      }
    },
    genButtonEvents (value: string, isAllowed: boolean) {
      throw new Error('Not implemented')
    },
    genButton (value: string, isFloating: boolean, formatter: DatePickerFormatter) {
      const isAllowed = isDateAllowed(value, this.min, this.max, this.allowedDates)
      const isSelected = Array.isArray(this.value) ? this.value.indexOf(value) !== -1 : value === this.value
      const isCurrent = value === this.currentDate
      const setColor = isSelected ? this.setBackgroundColor : this.setTextColor
      const color = (isSelected || isCurrent) && (this.color || 'accent')

      return this.$createElement('button', setColor(color, {
        staticClass: 'v-btn',
        'class': this.genButtonClasses(isAllowed, isFloating, isSelected, isCurrent),
        attrs: {
          type: 'button'
        },
        domProps: {
          disabled: this.disabled || !isAllowed
        },
        on: this.genButtonEvents(value, isAllowed)
      }), [
        this.$createElement('div', {
          staticClass: 'v-btn__content'
        }, [formatter(value)]),
        this.genEvents(value)
      ])
    },
    getEventColors (date: string) {
      const arrayize = (v: string | string[]) => Array.isArray(v) ? v : [v]
      let eventData: boolean | DateEventColorValue
      let eventColors: string[] = []

      if (Array.isArray(this.events)) {
        eventData = this.events.includes(date)
      } else if (this.events instanceof Function) {
        eventData = this.events(date) || false
      } else if (this.events) {
        eventData = this.events[date] || false
      } else {
        eventData = false
      }

      if (!eventData) {
        return []
      } else if (eventData !== true) {
        eventColors = arrayize(eventData)
      } else if (typeof this.eventColor === 'string') {
        eventColors = [this.eventColor]
      } else if (typeof this.eventColor === 'function') {
        eventColors = arrayize(this.eventColor(date))
      } else if (Array.isArray(this.eventColor)) {
        eventColors = this.eventColor
      } else {
        eventColors = arrayize(this.eventColor[date])
      }

      return eventColors.filter(v => v)
    },
    genEvents (date: string) {
      const eventColors = this.getEventColors(date)

      return eventColors.length ? this.$createElement('div', {
        staticClass: 'v-date-picker-table__events'
      }, eventColors.map(color => this.$createElement('div', this.setBackgroundColor(color)))) : null
    },
    wheel (e: WheelEvent) {
      e.preventDefault()
      this.$emit('update:pickerDate', this.calculatePickerDate(e.deltaY))
    },
    touch (value: number) {
      this.$emit('update:pickerDate', this.calculatePickerDate(value))
    },
    genTable (staticClass: string, children: VNodeChildren) {
      const transition = this.$createElement('transition', {
        props: { name: this.computedTransition }
      }, [this.$createElement('table', { key: String(this.pickerDate) }, children)])

      const touchDirective = {
        name: 'touch',
        value: {
          left: (e: TouchWrapper) => (e.offsetX < -15) && this.touch(1),
          right: (e: TouchWrapper) => (e.offsetX > 15) && this.touch(-1)
        }
      }

      return this.$createElement('div', {
        staticClass,
        class: {
          'v-date-picker-table--disabled': this.disabled,
          ...this.themeClasses
        },
        on: (!this.disabled && this.scrollable) ? {
          wheel: (e: WheelEvent) => this.wheel(e)
        } : undefined,
        directives: [touchDirective]
      }, [transition])
    }
  }
})
