import React, { Component } from 'react'
import {
  View,
  Animated,
  PanResponder,
  Dimensions,
  LayoutAnimation,
  UIManager
 } from 'react-native'

const SCREEN_WIDTH = Dimensions.get('window').width
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH
const SWIPE_OUT_DURATION = 250

class Deck extends Component {
  static defaultProps = {
    onSwipeLeft: () => {},
    onSwipeRight: () => {}
  }

  constructor (props) {
    super(props)
    this._position = new Animated.ValueXY()
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        this._position.setValue({ x: gesture.dx, y: gesture.dy })
      },
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          this.foreceSwipe('right')
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          this.foreceSwipe('left')
        } else {
          this.resetPosition()
        }
      }
    })
    this.state = { index: 0 }
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.data !== this.props.data) {
      this.setState({ index: 0 })
    }
  }

  componentWillUpdate () {
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true)
    LayoutAnimation.spring()
  }

  foreceSwipe (direction) {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH
    Animated.timing(this._position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION
    }).start(() => this.onSwipeComplete(direction))
  }

  onSwipeComplete (direction) {
    const { onSwipeLeft, onSwipeRight, data } = this.props
    const item = data[this.state.index]
    direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item)
    this._position.setValue({ x: 0, y: 0 })
    this.setState({ index: this.state.index + 1 })
  }

  resetPosition () {
    Animated.spring(this._position, {
      toValue: { x: 0, y: 0 }
    }).start()
  }

  getCardStyle () {
    const rotate = this._position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ['-120deg', '0deg', '120deg']
    })
    return {
      ...this._position.getLayout(),
      transform: [{ rotate }]
    }
  }

  renderCards () {
    if (this.state.index >= this.props.data.length) {
      return this.props.renderNoMoreCards()
    }

    return this.props.data.map((item, i) => {
      if (i < this.state.index) return null

      if (i === this.state.index) {
        return (
          <Animated.View
            key={item.id}
            style={[this.getCardStyle(), styles.card]}
            {...this._panResponder.panHandlers}
          >
            {this.props.renderCard(item)}
          </Animated.View>
        )
      }

      return (
        <Animated.View style={[styles.card, { top: 10 * (i - this.state.index) }]} key={item.id}>
          {this.props.renderCard(item)}
        </Animated.View>
      )
    }).reverse()
  }

  render () {
    return (
      <View>
        {this.renderCards()}
      </View>
    )
  }
}

const styles = {
  card: {
    width: SCREEN_WIDTH,
    position: 'absolute'
  }
}

export default Deck
