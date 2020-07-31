/**
 * External dependencies
 */
import { View, Animated, Easing, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { useEffect, useState, useRef } from '@wordpress/element';
import {
	ToolbarGroup,
	ToolbarButton,
	LinkSettings,
} from '@wordpress/components';
import { compose, usePreferredColorSchemeStyle } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { link, Icon } from '@wordpress/icons';
import { withSelect, useDispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { getIconBySite, getNameBySite } from './social-list';
import styles from './editor.scss';

const ANIMATION_DELAY = 300;
const ANIMATION_DURATION = 400;

const linkSettingsOptions = {
	url: {
		label: __( 'URL' ),
		placeholder: __( 'Add URL' ),
		autoFocus: true,
	},
	linkLabel: {
		label: __( 'Link label' ),
		placeholder: __( 'None' ),
	},
	footer: {
		label: __( 'Briefly describe the link to help screen reader user' ),
	},
};

const SocialLinkEdit = ( {
	attributes,
	setAttributes,
	isSelected,
	onFocus,
	name,
	clientId,
} ) => {
	const { url, service = name } = attributes;
	const [ isLinkSheetVisible, setIsLinkSheetVisible ] = useState( false );
	const [ hasUrl, setHasUrl ] = useState( !! url );
	const { updateBlock } = useDispatch( 'core/block-editor' );

	const activeIcon =
		styles[ `wp-social-link-${ service }` ] || styles[ `wp-social-link` ];

	const inactiveIcon = usePreferredColorSchemeStyle(
		styles.inactiveIcon,
		styles.inactiveIconDark
	);

	const animatedValue = useRef( new Animated.Value( 0 ) ).current;

	const IconComponent = getIconBySite( service )();
	const socialLinkName = getNameBySite( service );

	// When new social icon is added link sheet is opened automatically
	useEffect( () => {
		updateSocialIconName( true );
		if ( isSelected && ! url ) {
			setIsLinkSheetVisible( true );
		}

		return () => {
			updateSocialIconName( false );
		};
	}, [] );

	useEffect( () => {
		if ( ! url ) {
			setHasUrl( false );
			animatedValue.setValue( 0 );
		} else if ( url ) {
			animateColors();
		}
	}, [ url ] );

	const interpolationColors = {
		backgroundColor: animatedValue.interpolate( {
			inputRange: [ 0, 1 ],
			outputRange: [
				inactiveIcon.backgroundColor,
				activeIcon.backgroundColor,
			],
		} ),
		color: animatedValue.interpolate( {
			inputRange: [ 0, 1 ],
			outputRange: [ inactiveIcon.color, activeIcon.color ],
		} ),
		stroke: '',
	};

	const { backgroundColor, color, stroke } = hasUrl
		? activeIcon
		: interpolationColors;

	function updateSocialIconName( withService ) {
		const base = 'core/social-link';
		updateBlock( clientId, {
			name: withService ? `${ base }-${ service }` : base,
			attributes: { service },
		} );
	}

	function animateColors() {
		Animated.sequence( [
			Animated.delay( ANIMATION_DELAY ),
			Animated.timing( animatedValue, {
				toValue: 1,
				duration: ANIMATION_DURATION,
				easing: Easing.circle,
			} ),
		] ).start( () => setHasUrl( true ) );
	}

	function onCloseSettingsSheet() {
		setIsLinkSheetVisible( false );
	}

	function onOpenSettingsSheet() {
		setIsLinkSheetVisible( true );
	}

	function onEmptyURL() {
		animatedValue.setValue( 0 );
		setHasUrl( false );
	}

	function onIconPress() {
		if ( isSelected ) {
			setIsLinkSheetVisible( true );
		} else {
			onFocus();
		}
	}

	const accessibilityHint = url
		? sprintf(
				// translators: %s: social link name e.g: "Instagram".
				__( '%s has URL set' ),
				socialLinkName
		  )
		: sprintf(
				// translators: %s: social link name e.g: "Instagram".
				__( '%s has no URL set' ),
				socialLinkName
		  );

	return (
		<View>
			{ isSelected && (
				<BlockControls>
					<ToolbarGroup>
						<ToolbarButton
							title={ sprintf(
								// translators: %s: social link name e.g: "Instagram".
								__( 'Add link to %s' ),
								socialLinkName
							) }
							icon={ link }
							onClick={ onOpenSettingsSheet }
							isActive={ url }
						/>
					</ToolbarGroup>
				</BlockControls>
			) }
			<LinkSettings
				isVisible={ isLinkSheetVisible }
				attributes={ attributes }
				onEmptyURL={ onEmptyURL }
				onClose={ onCloseSettingsSheet }
				setAttributes={ setAttributes }
				options={ linkSettingsOptions }
				withBottomSheet={ true }
			/>
			<TouchableWithoutFeedback
				onPress={ onIconPress }
				accessibilityRole={ 'button' }
				accessibilityLabel={ sprintf(
					// translators: %s: social link name e.g: "Instagram".
					__( '%s social icon' ),
					socialLinkName
				) }
				accessibilityHint={ accessibilityHint }
			>
				<Animated.View
					style={ [ styles.iconContainer, { backgroundColor } ] }
				>
					<Icon
						animated
						icon={ IconComponent }
						style={ { stroke, color } }
					/>
				</Animated.View>
			</TouchableWithoutFeedback>
		</View>
	);
};

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const { getBlock } = select( 'core/block-editor' );

		const block = getBlock( clientId );
		const name = block?.name.substring( 17 );

		return {
			name,
		};
	} ),
] )( SocialLinkEdit );
