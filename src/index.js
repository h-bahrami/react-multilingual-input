import React, { Component } from 'react';
import PropTypes from 'prop-types';
import LanguageCodeMapping, { MultiLingualData } from './data';
import './styles.css';

export default class MultilingualInput extends Component {
    constructor(props) {
        super(props);
        this.keepExpanded = false;
        this.state = {
            stayExpanded: false,
            newlang: '',
            newtranslation: '',
        };
        this.handleModalCancel = this.handleModalCancel.bind(this);
        this.handleModalOk = this.handleModalOk.bind(this);

        this.modalRef = React.createRef();
        this.setModalVisibility = (visible = true) => {
            this.modalRef.current.style.display = visible ? 'block' : 'none';
        }
        this.generateLanguageOptions = () => {
            const children = [];
            LanguageCodeMapping.forEach((value, key) => {
                children.push(<option key={`option_${key}`} value={key}>{value}</option>);
            });
            return children;
        };
    }

    onInputFocusin() {
        this.keepExpanded = true;
        this.setState({ stayExpanded: true });
    }

    onInputFocusout() {
        this.keepExpanded = false;
        setTimeout(() => {
            if (!this.keepExpanded) this.setState({ stayExpanded: false });
        }, 200);
    }

    onTextChange(key, value) {
        const { onChange } = this.props;
        onChange(key, value);
    }

    onCopy(e) {
        const selection = window.getSelection().toString();
        if (selection === '' || selection === null || selection === undefined) {
            const text = this.getExcelStyleTextFromData();
            e.clipboardData.setData('text/plain', text);
            e.preventDefault();
        }
    }

    onPaste(e) {
        const d = e.clipboardData.getData('text');
        if (this.newRegex().test(d)) {
            e.preventDefault();
            const addToExisting = window.confirm('Do you want to add the values to the existing ones?');

            const { data } = this.props;
            const model = Object.assign({}, data);
            // eslint-disable-next-line
            const regex = new RegExp(/([a-zA-Z-]+)[\x09|\s]+(.+)[\r|\n|\r\n]/g);
            let match = regex.exec(d);
            while (match) {
                const key = match[1];
                const value = match[2];

                model.values[key] = (addToExisting && model.values[key] !== undefined ? `${model.values[key]} ${value}` : value);
                match = regex.exec(d);
            }
            const { onAllChange } = this.props;
            onAllChange(model);
        }
    }

    getExcelStyleTextFromData() {
        let text = '';
        const { data } = this.props;
        Object.keys(data.values).forEach((key) => {
            text += `${key}${String.fromCharCode(9)}${data.values[key]}\n`;
        });
        return text;
    }

    handleModalCancel() {
        this.setModalVisibility(false);
    }

    handleModalOk() {
        const { newlang, newtranslation } = this.state;
        this.onTextChange(newlang, newtranslation);
        this.setState({ newlang: '', newtranslation: '' });
        this.setModalVisibility(false);
    }

    generateInputs() {
        const { data } = this.props;
        const { defaultLanguage } = data;
        const defaultValue = data.values.get(defaultLanguage);
        const inputs = [];
        inputs.push(<tr key={`tr_${defaultLanguage}`}>
            <td key="td_0" style={{ minWidth: "150px" }}>{`${LanguageCodeMapping.get(defaultLanguage)} (${defaultLanguage.toUpperCase()})`}</td>
            <td key="td_1">{this.generateInput(defaultLanguage, defaultValue)}</td>
            <td key="td_2"><input type="button" value="+" onClick={() => this.setModalVisibility(true)} /></td>
        </tr>);
        const { stayExpanded } = this.state;
        data.values.forEach((value, key) => {
            if (key !== defaultLanguage && stayExpanded) {
                inputs.push(<tr key={`tr_${key}`}>
                    <td key="td_0">{`${LanguageCodeMapping.get(key)} (${key.toUpperCase()})`}</td>
                    <td key="td_1">{this.generateInput(key, value)}</td>
                    <td key="td_2"><input type="button" value="-" onClick={() => this.props.onDelete(key)} /></td>
                </tr>);
            }
        });
        return inputs;
    }

    generateInput(key, value) {
        return (
            <input
                type="text"
                id={`input_${key}`}
                value={value}
                readOnly={this.props.readOnly}
                minLength={this.props.minLength || 0}
                maxLength={this.props.maxLength || 100}
                onChange={(e) => this.onTextChange(key, e.target.value)}
                onFocus={(e) => this.onInputFocusin(key, e)}
                onBlur={(e) => this.onInputFocusout(key, e)}
                onCopy={(e) => this.onCopy(e)}
                onPaste={(e) => this.onPaste(e)}
                onKeyDown={(e) => {
                    if (e.keyCode === 45) {
                        this.setModalVisibility(true);
                    }
                }}
            />
        );
    }

    render() {
        return (
            <div className="multilingual_container" key={this.props.id} style={this.props.style}>
                <table key="table">
                    <tbody key="table_body">
                        {this.generateInputs()}
                    </tbody>
                </table>
                <div key="multilingual_modal_input" className="multilingual_modal" ref={this.modalRef}>
                    <div className="multilingual_modal-content">
                        <table className="multilingual_modal_table">
                            <caption>
                                Add New Value (langauge specific)
                            </caption>
                            <tbody>
                                <tr>
                                    <td>
                                        <select key="model_lang" onChange={(val) => this.setState({ newlang: val.target.value })}>
                                            {this.generateLanguageOptions()}
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <input key="model_val" type="text" onChange={(e) => this.setState({ newtranslation: e.target.value })} />
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{paddingTop: "15px"}}><input type="button" key="back" onClick={this.handleModalCancel} value="Cancel"
                                        style={{ float: "right", marginLeft: "3px" }} />
                                    <input type="button" key="submit" onClick={this.handleModalOk} value="Submit"
                                            style={{ float: "right", marginLeft: "3px" }} /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}


MultilingualInput.propTypes = {
    data: PropTypes.instanceOf(MultiLingualData),
    onChange: PropTypes.func.isRequired,
    onAllChange: PropTypes.func,
    onDelete: PropTypes.func.isRequired,
    style: PropTypes.style,    
};

MultilingualInput.defaultProps = {
    data: new MultiLingualData('fa'),
    onChange: () => console.log('onChange function is not connected.'),
    onAllChange: () => console.log('onAllChange function is not connected.'),
    onDelete: () => console.log('onDelete function is not connected.'),
    style: { width: '500px;' }
};