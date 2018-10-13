import React, {Component} from 'react';
import {connect} from 'react-redux';
import {translate} from 'react-i18next';
import PropTypes from 'prop-types';
import {Editor as TEditor} from '@tinymce/tinymce-react';
import HeaderAddress from './header-address';
import {editMessage} from '../../actions/application';
import {sendMessage} from '../../services/smtp';
import mainCss from '../../styles/main.scss';
import styles from './message-editor.scss';
import MceButton from './mce-button';


function _isStyled(editor, button) {
  return editor && editor.getContent().length > 0 && editor.queryCommandState(button.command);
}

function _isBlockStyled(editor, button) {
  return editor && editor.getContent().length > 0 && editor.queryCommandValue('FormatBlock') === button.blockCommand;
}

function _toggleStyle(editor, button) {
  editor.execCommand(button.command);
}

function _toggleBlockStyle(editor, button) {
  // Remove font-size
  Array.from(editor.selection.getNode().getElementsByTagName('*')).forEach(e => {
    e.style['font-size'] = '';
  });
  // editor.execCommand('mceToggleFormat', false, button.blockCommand);
  editor.execCommand('FormatBlock', false, button.blockCommand);
}

const INLINE_STYLE_BUTTONS = {
  bold: {
    command: 'bold', icon: 'format_bold',
    activeFunction: _isStyled, toggleFunction: _toggleStyle},
  italic: {
    command: 'italic', icon: 'format_italic',
    activeFunction: _isStyled, toggleFunction: _toggleStyle},
  underline: {
    command: 'underline', icon: 'format_underline',
    activeFunction: _isStyled, toggleFunction: _toggleStyle},
  unorderedList: {
    command: 'InsertUnorderedList', icon: 'format_list_bulleted',
    activeFunction: _isStyled, toggleFunction: _toggleStyle},
  orderedList: {
    command: 'InsertOrderedList', icon: 'format_list_numbered',
    activeFunction: _isStyled, toggleFunction: _toggleStyle},
  h1: {
    blockCommand: 'h1', label: 'H1', activeFunction: _isBlockStyled, toggleFunction: _toggleBlockStyle},
  h2: {
    blockCommand: 'h2', label: 'H2', activeFunction: _isBlockStyled, toggleFunction: _toggleBlockStyle},
  h3: {
    blockCommand: 'h3', label: 'H3', activeFunction: _isBlockStyled, toggleFunction: _toggleBlockStyle},
  blockquote: {
    blockCommand: 'blockquote', icon: 'format_quote',
    activeFunction: editor => editor.selection.getNode().closest('blockquote') !== null,
    toggleFunction: _toggleBlockStyle},
  pre: {
    blockCommand: 'pre', icon: 'space_bar', activeFunction: _isBlockStyled, toggleFunction: _toggleBlockStyle},
  code: {
    blockCommand: 'isotope_code', icon: 'code',
    activeFunction: editor => {
      const node = editor.selection.getNode();
      return node.tagName === 'PRE' && node.className === 'code';
    },
    toggleFunction: _toggleBlockStyle}
};

class MessageEditor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: {}
    };

    this.editorRef = React.createRef();
    this.handleSubmit = this.submit.bind(this);
    // Header Address Events
    this.handleOnHeaderKeyPress = this.onHeaderKeyPress.bind(this);
    this.handleOnHeaderBlur = this.onHeaderBlur.bind(this);
    this.handleOnHeaderAddressRemove = this.onHeaderAddressRemove.bind(this);
    // Subject events
    this.handleOnSubjectChange = this.onSubjectChange.bind(this);
    // Editor events
    this.handleEditorChange = this.editorChange.bind(this);
    this.handleSelectionChange = this.selectionChange.bind(this);
  }

  render() {
    const {t, className, close, to, cc, bcc, subject, content} = this.props;
    return (
      <div className={`${className} ${styles['message-editor']}`}>
        <div className={styles.header}>
          <HeaderAddress id={'to'} addresses={to} onKeyPress={this.handleOnHeaderKeyPress}
            onBlur={this.handleOnHeaderBlur} onAddressRemove={this.handleOnHeaderAddressRemove}
            className={styles.address} chipClassName={styles.chip} label={t('messageEditor.to')} />
          <HeaderAddress id={'cc'} addresses={cc} onKeyPress={this.handleOnHeaderKeyPress}
            onBlur={this.handleOnHeaderBlur} onAddressRemove={this.handleOnHeaderAddressRemove}
            className={styles.address} chipClassName={styles.chip} label={t('messageEditor.cc')} />
          <HeaderAddress id={'bcc'} addresses={bcc} onKeyPress={this.handleOnHeaderKeyPress}
            onBlur={this.handleOnHeaderBlur} onAddressRemove={this.handleOnHeaderAddressRemove}
            className={styles.address} chipClassName={styles.chip} label={t('messageEditor.bcc')} />
          <div className={styles.subject}>
            <input type={'text'} placeholder={'Subject'}
              value={subject} onChange={this.handleOnSubjectChange} />
          </div>
        </div>
        <div className={styles['editor-wrapper']} onClick={() => this.editorWrapperClick()}>
          <div className={styles['editor-container']}>
            <TEditor
              ref={this.editorRef}
              initialValue={content}
              onEditorChange={this.handleEditorChange}
              onSelectionChange={this.handleSelectionChange}
              inline={true}
              init={{
                menubar: false,
                statusbar: false,
                toolbar: false,
                plugins: 'autoresize',
                content_style: 'body {padding:0}', // DOESN'T WORK
                formats: {
                  isotope_code: {
                    block: 'pre', classes: ['code']
                  }
                }
              }}
            />
          </div>
          {this.renderEditorButtons()}
        </div>
        <div className={styles['action-buttons']}>
          <button
            className={`${mainCss['mdc-button']} ${mainCss['mdc-button--unelevated']}
            ${styles['action-button']} ${styles.send}`}
            disabled={to.length + cc.length + bcc.length === 0} onClick={this.handleSubmit}>
            Send
          </button>
          <button className={`material-icons ${mainCss['mdc-icon-button']} ${styles['action-button']} ${styles.cancel}`}
            onClick={close}>
            delete
          </button>
        </div>
      </div>
    );
  }

  renderEditorButtons() {
    return <div className={`${mainCss['mdc-card']} ${styles['button-container']}`}>
      {Object.entries(INLINE_STYLE_BUTTONS).map(([k, b]) => (
        <MceButton
          key={k}
          className={styles.button}
          activeClassName={styles.active}
          active={this.state.editorState && this.state.editorState[k] === true}
          label={b.label}
          icon={b.icon}
          onToggle={() => b.toggleFunction(this.getEditor(), b)}
        />))}
    </div>;
  }

  submit() {
    const {credentials, to, cc, bcc, subject, content} = this.props;
    sendMessage(credentials, {to, cc, bcc, subject, content});
    this.props.close();
  }

  onHeaderAddressRemove(id, index) {
    const updatedMessage = {...this.props.editedMessage};
    updatedMessage[id] = [...updatedMessage[id]];
    updatedMessage[id].splice(index, 1);
    this.props.editMessage(updatedMessage);
  }

  onHeaderKeyPress(event) {
    const target = event.target;
    if (event.key === 'Enter' || event.key === ';') {
      if (target.validity.valid) {
        this.addAddress(target);
        target.focus();
        event.preventDefault();
      } else {
        target.reportValidity();
      }
    }
  }

  onHeaderBlur(event) {
    const target = event.target;
    if (target.value.length > 0) {
      if (target.validity.valid) {
        this.addAddress(target);
      } else {
        event.preventDefault();
        setTimeout(() => target.reportValidity());
      }
    }
  }

  onSubjectChange(event) {
    const target = event.target;
    const updatedMessage = {...this.props.editedMessage};
    this.props.editMessage({...updatedMessage, subject: target.value});
  }
  /**
   * Adds an address to the list matching the id and value in the provided event target.
   *
   * @param target {object}
   */
  addAddress(target) {
    const value = target.value.replace(/;/g, '');
    if (value.length > 0) {
      const updatedMessage = {...this.props.editedMessage};
      updatedMessage[target.id] = [...updatedMessage[target.id], target.value.replace(/;/g, '')];
      this.props.editMessage(updatedMessage);
      target.value = '';
    }
  }

  getEditor() {
    if (this.editorRef.current && this.editorRef.current.editor) {
      return this.editorRef.current.editor;
    }
    return null;
  }

  editorWrapperClick() {
    this.getEditor().focus();
  }

  editorChange(content) {
    this.props.editMessage({...this.props.editedMessage, content});
  }

  selectionChange() {
    const editor = this.getEditor();
    const editorState = {};
    Object.entries(INLINE_STYLE_BUTTONS).forEach(([k, b]) => {
      editorState[k] = b.activeFunction(editor, b);
    });
    this.setState({editorState});
  }
}

MessageEditor.propTypes = {
  className: PropTypes.string,
  t: PropTypes.func.isRequired
};

MessageEditor.defaultProps = {
  className: ''
};

const mapStateToProps = state => ({
  credentials: state.application.user.credentials,
  editedMessage: state.application.newMessage,
  to: state.application.newMessage.to,
  cc: state.application.newMessage.cc,
  bcc: state.application.newMessage.bcc,
  subject: state.application.newMessage.subject,
  editor: state.application.newMessage.editor,
  content: state.application.newMessage.content
});

const mapDispatchToProps = dispatch => ({
  close: () => dispatch(editMessage(null)),
  editMessage: message => dispatch(editMessage(message))
});

export default connect(mapStateToProps, mapDispatchToProps)(translate()(MessageEditor));
